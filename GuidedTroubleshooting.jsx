import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Loader2, 
  AlertTriangle, 
  ThermometerSun, 
  Gauge, 
  Zap, 
  ArrowRight,
  CheckCircle
} from 'lucide-react'
  const API_BASE_URL = 'https://5003-ifso0ycmvzfunyjvom75k-e8649773.manusvm.computer'

const GuidedTroubleshooting = ({ onSessionComplete }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [equipmentTypes, setEquipmentTypes] = useState([])
  const [symptoms, setSymptoms] = useState({})
  const [formData, setFormData] = useState({
    equipment_type: '',
    location: '',
    symptoms: [],
    measurements: {},
    error_codes: [],
    additional_notes: ''
  })

  // Fetch equipment types and symptoms on component mount
  useEffect(() => {
    fetchEquipmentTypes()
    fetchSymptoms()
  }, [])

  const fetchEquipmentTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/types`)
      const data = await response.json()
      if (data.success) {
        setEquipmentTypes(data.equipment_types)
      }
    } catch (error) {
      console.error('Failed to fetch equipment types:', error)
    }
  }

  const fetchSymptoms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/symptoms`)
      const data = await response.json()
      if (data.success) {
        // Group symptoms by category
        const groupedSymptoms = data.symptoms.reduce((acc, symptom) => {
          if (!acc[symptom.category]) {
            acc[symptom.category] = []
          }
          acc[symptom.category].push(symptom)
          return acc
        }, {})
        setSymptoms(groupedSymptoms)
      }
    } catch (error) {
      console.error('Failed to fetch symptoms:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSymptomToggle = (symptomId, checked) => {
    setFormData(prev => ({
      ...prev,
      symptoms: checked 
        ? [...prev.symptoms, symptomId]
        : prev.symptoms.filter(s => s !== symptomId)
    }))
  }

  const handleMeasurementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value ? parseFloat(value) : undefined
      }
    }))
  }

  const handleSubmit = async () => {
    console.log('handleSubmit called')
    console.log('Current formData:', formData)
    console.log('API_BASE_URL:', API_BASE_URL)
    
    setLoading(true)
    
    try {
      console.log('Sending request to:', `${API_BASE_URL}/api/diagnostic/guided`)
      console.log('Request body:', JSON.stringify(formData, null, 2))
      
      const response = await fetch(`${API_BASE_URL}/api/diagnostic/guided`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success && data.session) {
        console.log('Diagnostic response received:', data)
        console.log('Session data:', data.session)
        onSessionComplete(data.session)
      } else {
        console.error('Diagnostic failed:', data.error || 'No session data received')
        alert(`Failed to submit diagnostic request: ${data.error || 'No session data received'}`)
      }
    } catch (error) {
      console.error('Failed to submit diagnostic:', error)
      alert(`Failed to submit diagnostic request: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const pollForResults = async (sessionId) => {
    const maxAttempts = 30
    let attempts = 0
    
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/diagnostic/session/${sessionId}`)
        const data = await response.json()
        
        if (data.success && data.session.status === 'completed') {
          onSessionComplete(data.session)
          setLoading(false)
          return
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else {
          setLoading(false)
          console.error('Polling timeout')
        }
      } catch (error) {
        console.error('Polling error:', error)
        setLoading(false)
      }
    }
    
    poll()
  }

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const getStepProgress = () => {
    return (step / 4) * 100
  }

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.equipment_type && formData.location
      case 2:
        return formData.symptoms.length > 0
      case 3:
        return true // Measurements are optional
      case 4:
        return true
      default:
        return false
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Your System</h3>
          <p className="text-slate-600 text-center mb-4">
            Our AI is processing your diagnostic information and generating recommendations...
          </p>
          <Progress value={75} className="w-64" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Step {step} of 4</Badge>
          <span className="text-sm text-slate-600">Guided Troubleshooting</span>
        </div>
        <Progress value={getStepProgress()} className="w-32" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {step === 1 && <><Gauge className="h-5 w-5 text-blue-600" /><span>Equipment Information</span></>}
            {step === 2 && <><AlertTriangle className="h-5 w-5 text-orange-600" /><span>System Symptoms</span></>}
            {step === 3 && <><ThermometerSun className="h-5 w-5 text-green-600" /><span>Measurements</span></>}
            {step === 4 && <><CheckCircle className="h-5 w-5 text-purple-600" /><span>Additional Information</span></>}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Tell us about the HVAC equipment you're working on"}
            {step === 2 && "Select all symptoms you've observed with the system"}
            {step === 3 && "Enter any measurements you've taken (optional but helpful)"}
            {step === 4 && "Add any additional notes or error codes"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Equipment Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipment-type">Equipment Type</Label>
                <Select 
                  value={formData.equipment_type} 
                  onValueChange={(value) => handleInputChange('equipment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-slate-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Unit Location</Label>
                <Select 
                  value={formData.location} 
                  onValueChange={(value) => handleInputChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor Unit</SelectItem>
                    <SelectItem value="outdoor">Outdoor Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.equipment_type && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Safety Reminder:</strong> Before proceeding, ensure power is disconnected at the breaker 
                    and follow all safety procedures for {equipmentTypes.find(t => t.id === formData.equipment_type)?.name.toLowerCase()} systems.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Symptoms */}
          {step === 2 && (
            <div className="space-y-6">
              {Object.entries(symptoms).map(([category, symptomList]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-slate-900 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {symptomList.map((symptom) => (
                      <div key={symptom.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Checkbox
                          id={symptom.id}
                          checked={formData.symptoms.includes(symptom.id)}
                          onCheckedChange={(checked) => handleSymptomToggle(symptom.id, checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={symptom.id} className="font-medium cursor-pointer">
                            {symptom.name}
                          </Label>
                          <p className="text-sm text-slate-600 mt-1">
                            {symptom.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Measurements */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="suction-pressure">Suction Pressure (PSI)</Label>
                  <Input
                    id="suction-pressure"
                    type="number"
                    placeholder="e.g., 65"
                    value={formData.measurements.suction_pressure || ''}
                    onChange={(e) => handleMeasurementChange('suction_pressure', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="discharge-pressure">Discharge Pressure (PSI)</Label>
                  <Input
                    id="discharge-pressure"
                    type="number"
                    placeholder="e.g., 250"
                    value={formData.measurements.discharge_pressure || ''}
                    onChange={(e) => handleMeasurementChange('discharge_pressure', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ambient-temp">Ambient Temperature (°F)</Label>
                  <Input
                    id="ambient-temp"
                    type="number"
                    placeholder="e.g., 85"
                    value={formData.measurements.ambient_temperature || ''}
                    onChange={(e) => handleMeasurementChange('ambient_temperature', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="supply-temp">Supply Air Temperature (°F)</Label>
                  <Input
                    id="supply-temp"
                    type="number"
                    placeholder="e.g., 55"
                    value={formData.measurements.supply_air_temperature || ''}
                    onChange={(e) => handleMeasurementChange('supply_air_temperature', e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Electrical Safety:</strong> Only take electrical measurements if you are qualified 
                  and have proper safety equipment. Use insulated tools and verify power is off.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="compressor-voltage">Compressor Voltage (V)</Label>
                  <Input
                    id="compressor-voltage"
                    type="number"
                    placeholder="e.g., 240"
                    value={formData.measurements.compressor_voltage || ''}
                    onChange={(e) => handleMeasurementChange('compressor_voltage', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fan-voltage">Fan Motor Voltage (V)</Label>
                  <Input
                    id="fan-voltage"
                    type="number"
                    placeholder="e.g., 120"
                    value={formData.measurements.fan_voltage || ''}
                    onChange={(e) => handleMeasurementChange('fan_voltage', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Information */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="error-codes">Error Codes (if any)</Label>
                <Input
                  id="error-codes"
                  placeholder="e.g., E1, F3"
                  value={formData.error_codes.join(', ')}
                  onChange={(e) => handleInputChange('error_codes', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                />
              </div>

              <div>
                <Label htmlFor="additional-notes">Additional Notes</Label>
                <Textarea
                  id="additional-notes"
                  placeholder="Describe any additional observations, when the problem started, or other relevant details..."
                  rows={4}
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Ready to Analyze
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We'll analyze your system information and provide diagnostic recommendations 
                  with safety warnings and step-by-step troubleshooting guidance.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={step === 1}
        >
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {step < 4 ? (
            <Button 
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Analyze System</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuidedTroubleshooting

