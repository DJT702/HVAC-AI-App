from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import openai

app = Flask(__name__)
CORS(app, origins="*")

# Try to import OpenAI, but continue without it if not available
try:
    from openai import OpenAI
    client = OpenAI(
        api_key=os.getenv('OPENAI_API_KEY'),
        base_url=os.getenv('OPENAI_API_BASE')
    )
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    client = None

# Sample data
EQUIPMENT_TYPES = [
    {
        "id": "split_system",
        "name": "Split System",
        "description": "Traditional split air conditioning system with indoor and outdoor units",
        "common_issues": ["refrigerant_leak", "fan_motor_failure", "compressor_issues"]
    },
    {
        "id": "mini_split",
        "name": "Mini Split",
        "description": "Ductless mini-split heat pump system",
        "common_issues": ["drainage_problems", "remote_control_issues", "filter_blockage"]
    },
    {
        "id": "package_unit",
        "name": "Package Unit",
        "description": "Self-contained package air conditioning unit",
        "common_issues": ["belt_problems", "control_board_failure", "coil_freezing"]
    },
    {
        "id": "heat_pump",
        "name": "Heat Pump",
        "description": "Heat pump system for heating and cooling",
        "common_issues": ["defrost_issues", "reversing_valve_problems", "auxiliary_heat_failure"]
    }
]

SYMPTOMS = [
    {"id": "not_cooling", "name": "Not Cooling", "category": "cooling", "description": "System runs but does not provide adequate cooling"},
    {"id": "insufficient_cooling", "name": "Insufficient Cooling", "category": "cooling", "description": "System cools but not to desired temperature"},
    {"id": "intermittent_cooling", "name": "Intermittent Cooling", "category": "cooling", "description": "System cools inconsistently or cycles on and off"},
    {"id": "unit_not_starting", "name": "Unit Not Starting", "category": "electrical", "description": "System does not turn on or respond to thermostat"},
    {"id": "frequent_breaker_trips", "name": "Frequent Breaker Trips", "category": "electrical", "description": "Circuit breaker trips repeatedly when system starts"},
    {"id": "display_errors", "name": "Display Errors", "category": "electrical", "description": "Error codes or warning lights on control panel"},
    {"id": "fan_not_spinning", "name": "Fan Not Spinning", "category": "mechanical", "description": "Indoor or outdoor fan motor not operating"},
    {"id": "unusual_noise", "name": "Unusual Noise", "category": "mechanical", "description": "Grinding, squealing, or other abnormal sounds"},
    {"id": "excessive_vibration", "name": "Excessive Vibration", "category": "mechanical", "description": "Unit vibrates more than normal during operation"},
    {"id": "ice_buildup", "name": "Ice Buildup", "category": "visual", "description": "Ice formation on evaporator coil or refrigerant lines"},
    {"id": "water_leak", "name": "Water Leak", "category": "visual", "description": "Water dripping or pooling around unit"},
    {"id": "burning_smell", "name": "Burning Smell", "category": "visual", "description": "Electrical or mechanical burning odor"}
]

def get_enhanced_diagnosis(equipment_type, location, symptoms, measurements, error_codes, description):
    """Get enhanced diagnosis with rule-based logic and OpenAI if available"""
    
    # Rule-based diagnosis logic
    equipment_name = next((eq['name'] for eq in EQUIPMENT_TYPES if eq['id'] == equipment_type), equipment_type)
    symptom_names = [next((s['name'] for s in SYMPTOMS if s['id'] == sym_id), sym_id) for sym_id in symptoms]
    
    # Analyze symptoms to determine likely issues
    cooling_issues = [s for s in symptoms if s in ['not_cooling', 'insufficient_cooling', 'intermittent_cooling']]
    electrical_issues = [s for s in symptoms if s in ['unit_not_starting', 'frequent_breaker_trips', 'display_errors']]
    mechanical_issues = [s for s in symptoms if s in ['fan_not_spinning', 'unusual_noise', 'excessive_vibration']]
    visual_issues = [s for s in symptoms if s in ['ice_buildup', 'water_leak', 'burning_smell']]
    
    # Determine primary issue based on symptoms
    if cooling_issues:
        if 'ice_buildup' in symptoms:
            primary_issue = "Refrigerant System with Ice Formation"
            confidence = 85
            likely_causes = [
                {"cause": "Low refrigerant charge", "probability": 80},
                {"cause": "Dirty evaporator coil", "probability": 70},
                {"cause": "Restricted airflow", "probability": 60}
            ]
        elif 'not_cooling' in symptoms:
            primary_issue = "Cooling System Failure"
            confidence = 82
            likely_causes = [
                {"cause": "Compressor failure", "probability": 75},
                {"cause": "Refrigerant leak", "probability": 70},
                {"cause": "Faulty expansion valve", "probability": 55}
            ]
        else:
            primary_issue = "Insufficient Cooling Performance"
            confidence = 78
            likely_causes = [
                {"cause": "Dirty air filter", "probability": 85},
                {"cause": "Low refrigerant", "probability": 65},
                {"cause": "Oversized/undersized system", "probability": 45}
            ]
    elif electrical_issues:
        if 'frequent_breaker_trips' in symptoms:
            primary_issue = "Electrical Overload Issue"
            confidence = 88
            likely_causes = [
                {"cause": "Compressor hard start", "probability": 80},
                {"cause": "Short circuit in wiring", "probability": 75},
                {"cause": "Faulty contactor", "probability": 60}
            ]
        else:
            primary_issue = "Electrical System Malfunction"
            confidence = 80
            likely_causes = [
                {"cause": "Thermostat failure", "probability": 70},
                {"cause": "Control board issue", "probability": 65},
                {"cause": "Wiring problem", "probability": 55}
            ]
    elif mechanical_issues:
        primary_issue = "Mechanical Component Failure"
        confidence = 83
        likely_causes = [
            {"cause": "Fan motor failure", "probability": 80},
            {"cause": "Belt wear/breakage", "probability": 65},
            {"cause": "Bearing wear", "probability": 50}
        ]
    else:
        primary_issue = "System Diagnostic Required"
        confidence = 70
        likely_causes = [
            {"cause": "Multiple potential issues", "probability": 60},
            {"cause": "Maintenance required", "probability": 70}
        ]
    
    # Generate recommendations based on symptoms
    recommended_actions = []
    if cooling_issues:
        recommended_actions.extend([
            {"action": "Check refrigerant levels and pressures", "priority": "high"},
            {"action": "Inspect evaporator and condenser coils", "priority": "high"},
            {"action": "Verify proper airflow", "priority": "medium"}
        ])
    if electrical_issues:
        recommended_actions.extend([
            {"action": "Test electrical connections and voltage", "priority": "high"},
            {"action": "Inspect control components", "priority": "high"},
            {"action": "Check thermostat operation", "priority": "medium"}
        ])
    if mechanical_issues:
        recommended_actions.extend([
            {"action": "Inspect fan motors and belts", "priority": "high"},
            {"action": "Check for loose components", "priority": "medium"},
            {"action": "Lubricate moving parts if needed", "priority": "low"}
        ])
    
    if not recommended_actions:
        recommended_actions = [
            {"action": "Perform comprehensive system inspection", "priority": "high"},
            {"action": "Check all electrical connections", "priority": "medium"},
            {"action": "Test system operation", "priority": "medium"}
        ]
    
    # Generate troubleshooting steps
    troubleshooting_steps = [
        {
            "title": "Safety Preparation",
            "description": "Turn off power at the breaker and gather proper PPE including safety glasses, insulated gloves, and hard hat",
            "safety_note": "Never work on energized equipment - always follow lockout/tagout procedures",
            "expected_result": "Safe working environment established"
        }
    ]
    
    if cooling_issues:
        troubleshooting_steps.append({
            "title": "Refrigerant System Check",
            "description": "Connect manifold gauges and check suction and discharge pressures against manufacturer specifications",
            "safety_note": "Wear safety glasses and ensure adequate ventilation when working with refrigerant",
            "expected_result": "Pressures should match specifications for current ambient temperature"
        })
    
    if electrical_issues:
        troubleshooting_steps.append({
            "title": "Electrical System Test",
            "description": "Use multimeter to check voltage at contactor, compressor, and fan motor terminals",
            "safety_note": "Use insulated tools and proper PPE when testing electrical components",
            "expected_result": "Voltage readings should match nameplate specifications"
        })
    
    troubleshooting_steps.append({
        "title": "Component Inspection",
        "description": "Visually inspect all accessible components for signs of damage, wear, or overheating",
        "safety_note": "Look for burn marks, unusual wear patterns, or damaged wiring",
        "expected_result": "Identify any obvious physical problems or safety hazards"
    })
    
    # Safety warnings based on symptoms and equipment
    safety_warnings = [
        {
            "level": "critical",
            "category": "electrical_safety",
            "message": "Turn off power at the breaker before performing any electrical work",
            "compliance": "NFPA 70E"
        }
    ]
    
    if 'burning_smell' in symptoms:
        safety_warnings.append({
            "level": "critical",
            "category": "fire_safety",
            "message": "Burning smell detected - shut down system immediately and investigate source",
            "compliance": "NFPA 70"
        })
    
    if 'frequent_breaker_trips' in symptoms:
        safety_warnings.append({
            "level": "high",
            "category": "electrical_safety",
            "message": "Electrical overload condition present - do not reset breaker without identifying cause",
            "compliance": "NFPA 70E"
        })
    
    safety_warnings.append({
        "level": "high",
        "category": "refrigerant_safety",
        "message": "Ensure adequate ventilation and wear eye protection when working with refrigerant",
        "compliance": "EPA 608"
    })
    
    diagnosis = {
        "primary_issue": primary_issue,
        "summary": f"Based on the {equipment_name} symptoms and diagnostic information, the system appears to have {primary_issue.lower()}. {len(symptom_names)} symptoms were identified requiring immediate attention.",
        "confidence_score": confidence,
        "likely_causes": likely_causes,
        "recommended_actions": recommended_actions[:3],  # Limit to top 3
        "troubleshooting_steps": troubleshooting_steps,
        "safety_warnings": safety_warnings
    }
    
    # If OpenAI is available, enhance the diagnosis
    if OPENAI_AVAILABLE and client and os.getenv('OPENAI_API_KEY'):
        try:
            # Create comprehensive diagnostic data for ChatGPT
            diagnostic_data = {
                "equipment_type": equipment_name,
                "location": location,
                "symptoms": symptom_names,
                "measurements": measurements,
                "error_codes": error_codes,
                "description": description,
                "preliminary_analysis": diagnosis
            }
            
            prompt = f"""You are an expert HVAC diagnostic assistant integrated into a professional troubleshooting application used by experienced HVAC technicians in the field. 

**CONTEXT:**
- Application: HVAC AI Troubleshooter - Professional diagnostic tool for field technicians
- User: Experienced HVAC technician with 5+ years experience
- Purpose: Provide detailed, actionable diagnostic analysis for complex HVAC issues
- Setting: On-site service call requiring professional-grade guidance

**DIAGNOSTIC DATA COLLECTED:**
Equipment Type: {equipment_name}
Location: {location}
Reported Symptoms: {', '.join(symptom_names)}
Measurements Taken: {json.dumps(measurements, indent=2) if measurements else 'None provided'}
Error Codes: {', '.join(error_codes) if error_codes else 'None reported'}
Technician Notes: {description if description else 'None provided'}

**PRELIMINARY ANALYSIS:**
Primary Issue: {diagnosis['primary_issue']}
Confidence: {diagnosis['confidence_score']}%
Top Likely Causes: {', '.join([f"{cause['cause']} ({cause['probability']}%)" for cause in diagnosis['likely_causes'][:3]])}

**INSTRUCTIONS:**
Provide a comprehensive diagnostic analysis formatted exactly like ChatGPT responses with clear sections and step-by-step guidance. Your response should be detailed enough for an experienced technician to follow without additional research.

**REQUIRED FORMAT:**

## 🔧 **Primary Diagnosis**
[Provide definitive diagnosis with confidence level]

## 📊 **Root Cause Analysis**
[Detailed analysis of why this issue occurred, considering all provided data]

## ⚡ **Immediate Actions Required**
1. [First critical step with specific details]
2. [Second critical step with specific details]
3. [Third critical step with specific details]

## 🔍 **Detailed Troubleshooting Steps**

### Step 1: [Title]
- **Action:** [Specific action to take]
- **Tools Needed:** [Specific tools/equipment]
- **Expected Reading:** [What measurements/observations to expect]
- **If Normal:** [Next step if readings are normal]
- **If Abnormal:** [What abnormal readings indicate]

### Step 2: [Title]
[Continue same format for 3-5 steps total]

## ⚠️ **Safety Considerations**
- [Equipment-specific safety warnings]
- [PPE requirements for this specific situation]
- [Electrical/refrigerant safety based on symptoms]

## 🛠️ **Parts & Materials Likely Needed**
- [Specific part numbers if possible]
- [Estimated costs and availability]
- [Alternative options if primary parts unavailable]

## ⏱️ **Estimated Repair Time**
[Realistic time estimate with breakdown]

## 💡 **Pro Tips**
[Advanced technician insights and best practices for this specific issue]

**TONE:** Professional, confident, detailed but concise. Write for an experienced technician who needs actionable guidance, not basic explanations."""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a master HVAC technician with 25+ years of experience providing detailed diagnostic analysis to field technicians. Always format responses with clear sections and step-by-step instructions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Replace the basic diagnosis with comprehensive ChatGPT analysis
            diagnosis = {
                "primary_issue": f"ChatGPT-4 Professional Analysis",
                "summary": ai_response,
                "confidence_score": min(95, diagnosis['confidence_score'] + 10),
                "likely_causes": diagnosis['likely_causes'],  # Keep original for compatibility
                "recommended_actions": diagnosis['recommended_actions'],  # Keep original for compatibility
                "troubleshooting_steps": diagnosis['troubleshooting_steps'],  # Keep original for compatibility
                "safety_warnings": diagnosis['safety_warnings'],  # Keep original for compatibility
                "chatgpt_analysis": True,
                "analysis_type": "comprehensive_professional"
            }
            
        except Exception as e:
            print(f"OpenAI enhancement failed: {e}")
    
    return diagnosis

@app.route('/api/equipment/types', methods=['GET'])
def get_equipment_types():
    return jsonify({
        'success': True,
        'equipment_types': EQUIPMENT_TYPES
    })

@app.route('/api/equipment/symptoms', methods=['GET'])
def get_symptoms():
    return jsonify({
        'success': True,
        'symptoms': SYMPTOMS
    })

@app.route('/api/diagnostic/guided', methods=['POST'])
def guided_diagnostic():
    try:
        data = request.get_json()
        
        # Get enhanced diagnosis
        ai_diagnosis = get_enhanced_diagnosis(
            equipment_type=data.get('equipment_type'),
            location=data.get('location'),
            symptoms=data.get('symptoms', []),
            measurements=data.get('measurements', {}),
            error_codes=data.get('error_codes', []),
            description=data.get('additional_notes', '')
        )
        
        # Create diagnostic session
        session = {
            'id': str(uuid.uuid4())[:8],
            'session_type': 'guided',
            'equipment_type': data.get('equipment_type'),
            'location': data.get('location'),
            'symptoms': data.get('symptoms', []),
            'measurements': data.get('measurements', {}),
            'error_codes': data.get('error_codes', []),
            'description': data.get('additional_notes', ''),
            'created_at': datetime.now().isoformat(),
            'status': 'completed',
            'confidence_score': ai_diagnosis.get('confidence_score', 75),
            'ai_diagnosis': ai_diagnosis
        }
        
        return jsonify({
            'success': True,
            'session': session
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/diagnostic/quick-submit', methods=['POST'])
def quick_submit():
    try:
        data = request.get_json()
        
        # Get enhanced diagnosis for quick submit
        ai_diagnosis = get_enhanced_diagnosis(
            equipment_type='unknown',
            location=data.get('location', 'unknown'),
            symptoms=[],
            measurements={},
            error_codes=[],
            description=data.get('description', '')
        )
        
        # Create quick submit session
        session = {
            'id': str(uuid.uuid4())[:8],
            'session_type': 'quick_submit',
            'location': data.get('location'),
            'description': data.get('description'),
            'created_at': datetime.now().isoformat(),
            'status': 'completed',
            'confidence_score': ai_diagnosis.get('confidence_score', 70),
            'ai_diagnosis': ai_diagnosis
        }
        
        return jsonify({
            'success': True,
            'session': session
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/images/upload', methods=['POST'])
def upload_image():
    return jsonify({
        'success': True,
        'message': 'Image upload functionality will be available in the full version',
        'analysis': {
            'text_detected': 'Model: ABC123, Error: E1',
            'components_identified': ['Compressor', 'Control Board'],
            'safety_concerns': ['High voltage warning visible']
        }
    })

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'HVAC AI Troubleshooter API',
        'version': '1.0.0 Enhanced with Rule-Based Logic',
        'openai_available': OPENAI_AVAILABLE,
        'openai_configured': bool(os.getenv('OPENAI_API_KEY')) if OPENAI_AVAILABLE else False
    })

@app.route('/api/follow-up', methods=['POST'])
def follow_up_question():
    try:
        data = request.json
        original_analysis = data.get('original_analysis', '')
        follow_up_question = data.get('follow_up_question', '')
        diagnostic_context = data.get('diagnostic_context', {})
        
        if not follow_up_question:
            return jsonify({'error': 'Follow-up question is required'}), 400
        
        # Create enhanced prompt for follow-up
        follow_up_prompt = f"""
You are an expert HVAC technician assistant providing follow-up support for a previous diagnostic analysis.

ORIGINAL ANALYSIS CONTEXT:
{original_analysis}

DIAGNOSTIC CONTEXT:
- Equipment Type: {diagnostic_context.get('equipment_type', 'Not specified')}
- Symptoms: {', '.join(diagnostic_context.get('symptoms', []))}
- Measurements: {diagnostic_context.get('measurements', 'Not provided')}

TECHNICIAN'S FOLLOW-UP QUESTION:
{follow_up_question}

Please provide a detailed, professional response that:
1. Directly addresses the technician's specific question
2. References the original analysis when relevant
3. Provides additional technical details or clarification
4. Includes safety considerations if applicable
5. Suggests next steps or additional diagnostics if needed

Format your response with clear headers and bullet points for easy reading.
"""
        
        # Call ChatGPT for follow-up response
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert HVAC diagnostic assistant providing professional follow-up support to experienced technicians."},
                {"role": "user", "content": follow_up_prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        follow_up_response = response.choices[0].message.content
        
        return jsonify({
            'follow_up_response': follow_up_response,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Follow-up error: {str(e)}")
        return jsonify({'error': 'Failed to process follow-up question'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

