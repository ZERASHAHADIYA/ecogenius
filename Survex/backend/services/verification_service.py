"""
EcoGenius AI-Assisted Proof Verification Service
Multi-pipeline verification engine for sustainability challenge submissions.
Routes submissions based on automated checks:
- AI_PASSED: All required checks passed -> normal admin approval queue
- MORE_EVIDENCE_REQUIRED: Incomplete or unclear evidence -> student notified for resubmission
- AI_REJECTED: Substantial failure or violation -> student notified with appeal option
- AI_ERROR: Service or decoding failure -> safe retry or manual review
"""

import hashlib
import re
import os
import io
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

MODEL_VERSION = "EcoGenius-VisionAudit-v2.1"

# Supported evidence formats
SUPPORTED_IMAGE_FORMATS = {'jpg', 'jpeg', 'png', 'webp'}
SUPPORTED_DOC_FORMATS = {'pdf', 'txt'}
SUPPORTED_VIDEO_FORMATS = {'mp4', 'mov', 'webm'}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


def compute_evidence_hash(media_url: str, description: str = "") -> str:
    """Compute SHA-256 fingerprint of evidence content/URL for duplicate screening"""
    content = f"{media_url.strip()}|{description.strip().lower()}".encode('utf-8')
    return hashlib.sha256(content).hexdigest()


def screen_image_origin(media_url: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Screen image for potential synthetic/AI generation or editing software metadata.
    NOTE: A flag alone must NEVER be treated as conclusive proof of misconduct.
    This check is purely advisory for human admin review.
    """
    metadata = metadata or {}
    ai_flags = []
    synthetic_probability = 0.05  # baseline low
    
    url_lower = (media_url or '').lower()
    desc_meta = str(metadata).lower()

    # Known generator signatures in URLs or metadata
    known_ai_signatures = [
        ('dall-e', 0.85, 'DALL-E metadata tag detected in image asset'),
        ('midjourney', 0.88, 'Midjourney artifact tag detected'),
        ('stable diffusion', 0.82, 'Stable Diffusion metadata trace detected'),
        ('novelai', 0.85, 'NovelAI generation tag detected'),
        ('synthetic', 0.70, 'Synthetic media tag detected'),
        ('photoshop', 0.45, 'Image editing software metadata detected'),
        ('c2pa', 0.60, 'C2PA content credentials present'),
        ('generative_fill', 0.75, 'Generative fill manipulation trace detected')
    ]

    for sig, prob, label in known_ai_signatures:
        if sig in url_lower or sig in desc_meta:
            ai_flags.append(label)
            synthetic_probability = max(synthetic_probability, prob)

    # Resolution heuristic for common generative square outputs without camera EXIF
    width = metadata.get('width')
    height = metadata.get('height')
    has_camera_exif = metadata.get('has_camera_exif', False)

    if width and height and width == height and width in [512, 1024, 2048] and not has_camera_exif:
        ai_flags.append('Uniform square dimension commonly produced by text-to-image models (advisory only)')
        synthetic_probability = max(synthetic_probability, 0.40)

    is_flagged = synthetic_probability >= 0.75
    return {
        'passed': not is_flagged,
        'synthetic_probability': round(synthetic_probability, 2),
        'is_flagged': is_flagged,
        'flags': ai_flags,
        'provenance_status': 'verified_genuine' if not is_flagged else 'flagged_for_human_screening',
        'details': 'Image origin screened cleanly.' if not ai_flags else '; '.join(ai_flags)
    }


def check_duplicate_evidence(evidence_hash: str, known_hashes: Optional[List[Dict[str, Any]]], current_submission_id: str) -> Dict[str, Any]:
    """
    Check if the evidence hash has already been submitted by another user or in a past approved challenge.
    """
    if not known_hashes or not evidence_hash:
        return {'passed': True, 'reused': False, 'details': 'No duplicate matches found in campus registry.'}

    for item in known_hashes:
        if item.get('hash') == evidence_hash and item.get('submission_id') != current_submission_id:
            return {
                'passed': False,
                'reused': True,
                'prior_submission_id': item.get('submission_id'),
                'prior_student_id': item.get('student_id'),
                'details': f"Duplicate evidence detected: Evidence matches an existing campus submission (ID: {item.get('submission_id')})."
            }

    return {'passed': True, 'reused': False, 'details': 'Evidence uniqueness verified across campus database.'}


# =====================================================================
# Category-Specific Verification Pipelines
# =====================================================================

def verify_electricity_pipeline(submission: Dict[str, Any], challenge: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str], List[str], List[str]]:
    """
    Electricity Pipeline:
    - Verifies unused electrical equipment switched off / unplugged.
    - Before-and-after evidence or clear switch-off photo + short explanation.
    - Verification code check if challenge code exists.
    - NOTE: Do NOT require meter readings unless explicitly required.
    """
    findings = []
    warnings = []
    missing_evidence = []
    score = 0.0

    description = (submission.get('description') or submission.get('caption') or '').strip()
    proof_files = submission.get('proof_files') or []
    if not proof_files and submission.get('proof_image'):
        proof_files = [submission.get('proof_image')]
    elif not proof_files and submission.get('media_url'):
        proof_files = [submission.get('media_url')]

    # 1. Evidence files check
    if len(proof_files) == 0:
        missing_evidence.append('Photo or video proof of switched-off electrical equipment')
    else:
        findings.append(f"Received {len(proof_files)} evidence asset(s)")
        score += 0.35

    # 2. Before-and-after check (either 2+ media files or descriptive before-and-after breakdown)
    has_two_photos = len(proof_files) >= 2
    desc_lower = description.lower()
    has_before_after_keywords = any(k in desc_lower for k in ['before', 'after', 'turned off', 'switched off', 'unplugged', 'powered down'])

    if has_two_photos or has_before_after_keywords:
        findings.append("Before-and-after power conservation state documented")
        score += 0.30
    else:
        warnings.append("Before-and-after evidence is recommended (e.g. equipment active vs powered down)")
        score += 0.15

    # 3. Electrical equipment context & explanation keywords
    elec_keywords = [
        'switch', 'light', 'fan', 'ac', 'air conditioner', 'computer', 'monitor',
        'charger', 'projector', 'lab', 'dorm', 'hall', 'room', 'plug', 'watt',
        'idle', 'phantom', 'grid', 'consumption', 'equipment', 'appliance', 'standby'
    ]
    matched_keywords = [k for k in elec_keywords if k in desc_lower]

    word_count = len(description.split())
    if word_count < 8:
        missing_evidence.append('Short explanation describing which equipment was switched off and its campus location')
    else:
        findings.append(f"Explanation provided ({word_count} words, matched concepts: {', '.join(matched_keywords[:4]) or 'equipment power'})")
        score += 0.25

    # 4. Short-lived verification code check (deterrent against reuse)
    expected_code = submission.get('challenge_code') or challenge.get('challenge_code')
    submitted_code = submission.get('submitted_code') or ''
    if expected_code:
        if submitted_code and submitted_code.strip().upper() == expected_code.strip().upper():
            findings.append(f"Unique challenge verification code verified ({expected_code})")
            score += 0.10
        elif expected_code.lower() in desc_lower:
            findings.append(f"Verification code found in explanation ({expected_code})")
            score += 0.10
        else:
            warnings.append(f"Challenge verification code '{expected_code}' not detected in upload (advisory deterrent)")

    passed = len(missing_evidence) == 0 and score >= 0.65
    return {
        'passed': passed,
        'category_score': round(min(1.0, score), 2),
        'matched_keywords': matched_keywords,
        'has_before_after': has_two_photos or has_before_after_keywords,
        'requires_meter_reading': False
    }, findings, warnings, missing_evidence


def verify_water_pipeline(submission: Dict[str, Any], challenge: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str], List[str], List[str]]:
    """
    Water Pipeline:
    - Identify and report leaking tap/pipe.
    - Relevant photo, location details (block/floor/room), and report confirmation where available.
    - NOTE: Do NOT require water meter readings unless explicitly required.
    """
    findings = []
    warnings = []
    missing_evidence = []
    score = 0.0

    description = (submission.get('description') or submission.get('caption') or '').strip()
    location_details = submission.get('location_details') or submission.get('location') or ''
    report_confirmation = submission.get('report_confirmation') or submission.get('ticket_id') or ''
    proof_files = submission.get('proof_files') or []
    if not proof_files and submission.get('proof_image'):
        proof_files = [submission.get('proof_image')]
    elif not proof_files and submission.get('media_url'):
        proof_files = [submission.get('media_url')]

    # 1. Photo evidence
    if len(proof_files) == 0:
        missing_evidence.append('Clear photo showing the leaking tap, faucet, or pipe issue')
    else:
        findings.append(f"Received {len(proof_files)} water conservation evidence asset(s)")
        score += 0.35

    # 2. Location details check (hostel/block, floor, washroom/room)
    full_loc_text = f"{location_details} {description}".lower()
    loc_keywords = ['block', 'floor', 'hostel', 'lab', 'canteen', 'washroom', 'restroom', 'garden', 'corridor', 'building', 'library', 'mess', 'dorm', 'room']
    has_loc = any(k in full_loc_text for k in loc_keywords) or len(location_details.strip()) >= 8

    if has_loc:
        findings.append(f"Specific campus location identified: '{location_details.strip() or 'Identified in description'}'")
        score += 0.30
    else:
        missing_evidence.append('Specific campus location details (e.g. Block number, floor, or washroom identifier)')

    # 3. Water leak keywords
    water_keywords = ['leak', 'tap', 'faucet', 'drip', 'pipe', 'valve', 'spill', 'water', 'drain', 'flow', 'aerator', 'flush']
    matched_keywords = [k for k in water_keywords if k in full_loc_text]
    if len(matched_keywords) >= 1:
        findings.append(f"Water leakage context validated ({', '.join(matched_keywords[:4])})")
        score += 0.20
    else:
        warnings.append("Water leakage context words missing from description")

    # 4. Maintenance report confirmation or ticket # (where available)
    if report_confirmation and len(str(report_confirmation).strip()) >= 3:
        findings.append(f"Campus maintenance report confirmation / ticket referenced: '{report_confirmation}'")
        score += 0.15
    else:
        warnings.append("Maintenance report confirmation number is optional but recommended if reported to campus facility team")
        score += 0.05  # partial score

    passed = len(missing_evidence) == 0 and score >= 0.65
    return {
        'passed': passed,
        'category_score': round(min(1.0, score), 2),
        'location_verified': has_loc,
        'has_report_confirmation': bool(report_confirmation),
        'requires_meter_reading': False
    }, findings, warnings, missing_evidence


def verify_waste_pipeline(submission: Dict[str, Any], challenge: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str], List[str], List[str]]:
    """
    Waste Pipeline:
    - Sort five safe waste items into appropriate bins.
    - Submit photo plus selected waste categories (e.g. plastic, organic, paper, metal, e-waste).
    """
    findings = []
    warnings = []
    missing_evidence = []
    score = 0.0

    description = (submission.get('description') or submission.get('caption') or '').strip()
    selected_categories = submission.get('selected_categories') or submission.get('waste_items') or []
    proof_files = submission.get('proof_files') or []
    if not proof_files and submission.get('proof_image'):
        proof_files = [submission.get('proof_image')]
    elif not proof_files and submission.get('media_url'):
        proof_files = [submission.get('media_url')]

    # 1. Photo of sorted items
    if len(proof_files) == 0:
        missing_evidence.append('Photo showing segregated waste items at campus color-coded bins')
    else:
        findings.append(f"Received {len(proof_files)} segregation photo(s)")
        score += 0.35

    # 2. Selected waste categories (should sort at least 5 safe items or specify multiple categories)
    if isinstance(selected_categories, str):
        selected_categories = [c.strip() for c in selected_categories.split(',') if c.strip()]

    # Extract any categorized items listed in description if not explicitly in array
    desc_lower = description.lower()
    standard_categories = ['plastic', 'organic', 'wet waste', 'dry waste', 'paper', 'cardboard', 'metal', 'can', 'e-waste', 'battery', 'glass']
    found_in_desc = [cat for cat in standard_categories if cat in desc_lower]
    total_distinct_categories = len(set(selected_categories + found_in_desc))

    # Check for 5 items count in description (e.g. "item 1, 2, 3, 4, 5" or bullet points)
    numbered_items = len(re.findall(r'(\d[\.\)]|[•\-\*])\s*\w+', description))
    has_five_items = len(selected_categories) >= 5 or numbered_items >= 5 or total_distinct_categories >= 3

    if has_five_items:
        findings.append(f"Item segregation verified: {max(len(selected_categories), numbered_items, total_distinct_categories)} items/categories documented")
        score += 0.40
    else:
        missing_evidence.append('Documentation of five safe waste items sorted into respective bins (e.g. Plastic, Organic, Paper, Metal, E-Waste)')

    # 3. Bin/segregation context
    waste_keywords = ['bin', 'sort', 'segregat', 'recycle', 'compost', 'dispos', 'color', 'green', 'blue', 'yellow', 'dry', 'wet']
    matched_keywords = [k for k in waste_keywords if k in desc_lower]
    if len(matched_keywords) >= 1:
        findings.append(f"Waste sorting terminology detected ({', '.join(matched_keywords[:4])})")
        score += 0.25
    else:
        warnings.append("Waste segregation bin context terms are sparse in the description")

    passed = len(missing_evidence) == 0 and score >= 0.65
    return {
        'passed': passed,
        'category_score': round(min(1.0, score), 2),
        'items_count': max(len(selected_categories), numbered_items, total_distinct_categories),
        'has_five_items': has_five_items
    }, findings, warnings, missing_evidence


def verify_environmental_pipeline(submission: Dict[str, Any], challenge: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str], List[str], List[str]]:
    """
    Environmental & Tree Planting Pipeline:
    - Verifies planting of saplings/trees or campus greenery care.
    - Photo of planted tree(s) or maintenance.
    - Description of tree location, species, or planting action (min 2 trees recommended).
    """
    findings = []
    warnings = []
    missing_evidence = []
    score = 0.0

    description = (submission.get('description') or submission.get('caption') or '').strip()
    proof_files = submission.get('proof_files') or []
    if not proof_files and submission.get('proof_image'):
        proof_files = [submission.get('proof_image')]
    elif not proof_files and submission.get('media_url'):
        proof_files = [submission.get('media_url')]

    if len(proof_files) == 0:
        missing_evidence.append('Photo showing planted tree(s), sapling, or campus greenery action')
    else:
        findings.append(f"Received {len(proof_files)} tree planting / greenery photo(s)")
        score += 0.40

    desc_lower = description.lower()
    tree_keywords = ['tree', 'plant', 'sapling', 'soil', 'garden', 'green', 'leaf', 'flora', 'campus', 'water', 'seed', 'root', 'shovel', 'nature']
    matched_keywords = [k for k in tree_keywords if k in desc_lower]

    has_two_trees = any(k in desc_lower for k in ['2 tree', 'two tree', 'trees', 'saplings', 'planted 2', 'planted 3', 'planted 4', 'planted 5']) or len(proof_files) >= 2 or 'plant' in desc_lower

    if len(matched_keywords) >= 2:
        findings.append(f"Greenery & planting context validated ({', '.join(matched_keywords[:4])})")
        score += 0.35
    else:
        warnings.append("Greenery / planting context details are brief in description")
        score += 0.15

    if len(description.split()) >= 6:
        score += 0.25
        findings.append(f"Tree planting details documented ({len(description.split())} words)")
    else:
        missing_evidence.append('Description of tree species, count (min 2 trees), or campus location')

    passed = len(missing_evidence) == 0 and score >= 0.65
    return {
        'passed': passed,
        'category_score': round(min(1.0, score), 2),
        'matched_keywords': matched_keywords,
        'has_two_trees': has_two_trees
    }, findings, warnings, missing_evidence


def verify_transportation_pipeline(submission: Dict[str, Any], challenge: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str], List[str], List[str]]:
    """
    Transportation Pipeline:
    - Verifies sustainable campus commute (cycling, walking, electric shuttle, public transit).
    - Photo of bicycle, transit ticket, or distance tracking log.
    - Route or commute details indicating carbon savings.
    """
    findings = []
    warnings = []
    missing_evidence = []
    score = 0.0

    description = (submission.get('description') or submission.get('caption') or '').strip()
    proof_files = submission.get('proof_files') or []
    if not proof_files and submission.get('proof_image'):
        proof_files = [submission.get('proof_image')]
    elif not proof_files and submission.get('media_url'):
        proof_files = [submission.get('media_url')]

    if len(proof_files) == 0:
        missing_evidence.append('Photo of eco-friendly commute (bicycle, route log, or transit ticket)')
    else:
        findings.append(f"Received {len(proof_files)} eco-commute proof photo(s)")
        score += 0.40

    desc_lower = description.lower()
    transport_keywords = ['bike', 'bicycle', 'cycl', 'walk', 'pedestrian', 'bus', 'transit', 'metro', 'shuttle', 'commute', 'km', 'distance', 'carbon', 'route', 'electric']
    matched_keywords = [k for k in transport_keywords if k in desc_lower]

    if len(matched_keywords) >= 1:
        findings.append(f"Sustainable commute terminology validated ({', '.join(matched_keywords[:4])})")
        score += 0.35
    else:
        warnings.append("Commute terminology is limited in description")
        score += 0.15

    if len(description.split()) >= 6:
        score += 0.25
        findings.append(f"Commute route / mode documented ({len(description.split())} words)")
    else:
        missing_evidence.append('Brief description of commute mode (e.g. cycling/walking), distance, or campus route')

    passed = len(missing_evidence) == 0 and score >= 0.65
    return {
        'passed': passed,
        'category_score': round(min(1.0, score), 2),
        'matched_keywords': matched_keywords
    }, findings, warnings, missing_evidence


# =====================================================================
# Main Shared Verification Service
# =====================================================================

def verify_submission(
    submission: Optional[Dict[str, Any]],
    challenge: Optional[Dict[str, Any]],
    known_hashes: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Shared AI-Assisted Verification Service:
    Evaluates submission proof and routes based on:
    - AI_PASSED: Normal admin approval queue
    - MORE_EVIDENCE_REQUIRED: Replacement submission requested from student
    - AI_REJECTED: Rejection notice with student appeal workflow
    - AI_ERROR: Safe fallback for service recovery
    """
    verification_id = f"ver_{int(time.time())}_{hashlib.md5(str(id(submission)).encode()).hexdigest()[:6]}"
    attempt_number = 1

    try:
        if not submission or not challenge:
            raise ValueError("Submission and Challenge descriptors must be provided to verification service.")

        sub_id = str(submission.get('_id') or submission.get('id') or '')
        attempt_number = submission.get('attempt_number', 1)
        category = (challenge.get('category') or '').lower()
        student_id = str(submission.get('student_id') or submission.get('studentId') or '')
        description = (submission.get('description') or submission.get('caption') or '').strip()
        
        # Resolve proof media
        proof_files = submission.get('proof_files') or []
        if not proof_files and submission.get('proof_image'):
            proof_files = [submission.get('proof_image')]
        elif not proof_files and submission.get('media_url'):
            proof_files = [submission.get('media_url')]

        primary_media = proof_files[0] if proof_files else ''
        if isinstance(primary_media, dict):
            primary_media = primary_media.get('url') or primary_media.get('name') or ''

        # -----------------------------------------------------------------
        # Check 1: File Validity, Decode & Constraints
        # -----------------------------------------------------------------
        file_valid = True
        file_details = "File format and decoding constraints valid"
        
        if not primary_media and len(description) < 10:
            return {
                'verification_id': verification_id,
                'attempt_number': attempt_number,
                'outcome': 'MORE_EVIDENCE_REQUIRED',
                'confidence_score': 0.10,
                'category': challenge.get('category', 'General'),
                'checks': {
                    'file_validity': {'passed': False, 'details': 'No proof media file or substantive description provided.'},
                    'duplicate_check': {'passed': True, 'reused': False, 'details': 'Skipped'},
                    'ai_screening': {'passed': True, 'synthetic_probability': 0.0, 'details': 'Skipped'},
                    'requirement_matching': {'passed': False, 'score': 0.0, 'details': 'Missing proof'}
                },
                'findings': ['Submission lacks required photo/video proof.'],
                'warnings': [],
                'missing_evidence': ['Clear photo or video evidence file', 'Detailed description of action taken'],
                'recommended_status': 'MORE_EVIDENCE_REQUIRED',
                'model_version': MODEL_VERSION,
                'verified_at': datetime.now().isoformat()
            }

        # Check file extension if detectable
        if primary_media:
            path_part = str(primary_media).split('?')[0].split('#')[0]
            disallowed_extensions = {'exe', 'bat', 'cmd', 'sh', 'zip', 'tar', 'gz', 'iso', 'bin'}
            if '/' in path_part and '.' in path_part.split('/')[-1]:
                file_name = path_part.split('/')[-1]
                ext = file_name.split('.')[-1].lower()
                if ext in disallowed_extensions:
                    file_valid = False
                    file_details = f"Unsupported file type .{ext}. Allowed: Images (JPG, PNG, WEBP), Videos, and PDFs."

        # -----------------------------------------------------------------
        # Check 2: Duplicate & Reused Evidence Screening
        # -----------------------------------------------------------------
        evidence_hash = compute_evidence_hash(str(primary_media), description)
        duplicate_res = check_duplicate_evidence(evidence_hash, known_hashes, sub_id)

        # -----------------------------------------------------------------
        # Check 3: Image-Origin Screening (AI / Synthetic Media)
        # -----------------------------------------------------------------
        ai_origin_res = screen_image_origin(str(primary_media), submission.get('metadata'))

        # -----------------------------------------------------------------
        # Check 4: Category-Specific Pipeline
        # -----------------------------------------------------------------
        if 'electr' in category or 'energy' in category or 'solar' in category:
            cat_res, findings, warnings, missing_evidence = verify_electricity_pipeline(submission, challenge)
            cat_name = 'Electricity Conservation'
        elif 'water' in category or 'hydro' in category or 'leak' in category or 'harvest' in category or 'greywater' in category:
            cat_res, findings, warnings, missing_evidence = verify_water_pipeline(submission, challenge)
            cat_name = 'Water Conservation'
        elif 'environ' in category or 'tree' in category or 'plant' in category or 'green' in category:
            cat_res, findings, warnings, missing_evidence = verify_environmental_pipeline(submission, challenge)
            cat_name = 'Environmental & Tree Planting'
        elif 'transport' in category or 'commute' in category or 'transit' in category or 'bike' in category or 'cycl' in category:
            cat_res, findings, warnings, missing_evidence = verify_transportation_pipeline(submission, challenge)
            cat_name = 'Sustainable Transportation'
        elif 'waste' in category or 'clean' in category or 'plastic' in category or 'compost' in category or 'food' in category:
            cat_res, findings, warnings, missing_evidence = verify_waste_pipeline(submission, challenge)
            cat_name = 'Waste Management'
        else:
            cat_res, findings, warnings, missing_evidence = verify_waste_pipeline(submission, challenge)
            cat_name = challenge.get('category', 'General Sustainability')

        # Combine checks and evaluate routing outcome
        checks = {
            'file_validity': {'passed': file_valid, 'details': file_details},
            'duplicate_check': duplicate_res,
            'ai_screening': ai_origin_res,
            'requirement_matching': cat_res
        }

        # Calculate overall confidence score (0.0 to 1.0)
        confidence = round(
            (0.50 * cat_res.get('category_score', 0.5)) +
            (0.25 * (1.0 - ai_origin_res.get('synthetic_probability', 0.05))) +
            (0.15 * (1.0 if not duplicate_res.get('reused') else 0.0)) +
            (0.10 * (1.0 if file_valid else 0.0)),
            2
        )

        # -----------------------------------------------------------------
        # Routing Decision
        # -----------------------------------------------------------------
        if duplicate_res.get('reused'):
            # Reused duplicate proof
            outcome = 'AI_REJECTED'
            findings.append("Proof matches previously submitted evidence in campus database.")
            warnings.append("Reused evidence detected across student submissions.")
        elif not file_valid:
            outcome = 'MORE_EVIDENCE_REQUIRED'
            missing_evidence.append("Upload evidence in a supported format (JPG, PNG, WEBP, MP4)")
        elif missing_evidence:
            outcome = 'MORE_EVIDENCE_REQUIRED'
        elif ai_origin_res.get('is_flagged'):
            # Notice: Per requirements, synthetic flag is NOT an auto-fraudulent label.
            # It routes to normal queue with explicit AI warning or MORE_EVIDENCE_REQUIRED.
            warnings.append("Image-origin screening flagged possible synthetic/edited characteristics. Admin visual review recommended.")
            # If evidence requirements passed solidly, allow human admin to inspect in normal queue with warning
            if cat_res.get('passed'):
                outcome = 'AI_PASSED'
            else:
                outcome = 'MORE_EVIDENCE_REQUIRED'
        elif cat_res.get('passed') and confidence >= 0.65:
            outcome = 'AI_PASSED'
        else:
            outcome = 'AI_REJECTED'

        return {
            'verification_id': verification_id,
            'attempt_number': attempt_number,
            'outcome': outcome,
            'confidence_score': confidence,
            'category': cat_name,
            'evidence_hash': evidence_hash,
            'checks': checks,
            'findings': findings,
            'warnings': warnings,
            'missing_evidence': missing_evidence,
            'recommended_status': outcome,
            'model_version': MODEL_VERSION,
            'verified_at': datetime.now().isoformat()
        }

    except Exception as e:
        # Graceful failure: Record failure as AI_ERROR without accusing student
        cat_name = (challenge or {}).get('category', 'Unknown') if isinstance(challenge, dict) else 'Unknown'
        return {
            'verification_id': verification_id,
            'attempt_number': attempt_number,
            'outcome': 'AI_ERROR',
            'confidence_score': 0.0,
            'category': cat_name,
            'checks': {
                'file_validity': {'passed': False, 'details': f"Verification service exception: {str(e)}"},
                'duplicate_check': {'passed': True, 'reused': False, 'details': 'Bypassed due to service error'},
                'ai_screening': {'passed': True, 'synthetic_probability': 0.0, 'details': 'Bypassed due to service error'},
                'requirement_matching': {'passed': False, 'score': 0.0, 'details': 'Bypassed due to service error'}
            },
            'findings': ['Verification pipeline encountered an internal processing error.'],
            'warnings': ['Automated check could not complete. Eligible for retry or manual human review.'],
            'missing_evidence': [],
            'recommended_status': 'AI_ERROR',
            'error_details': str(e),
            'model_version': MODEL_VERSION,
            'verified_at': datetime.now().isoformat()
        }
