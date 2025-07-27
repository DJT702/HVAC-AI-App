import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  X,
  Loader2,
  Camera,
  AlertTriangle,
  CheckCircle,
  FileImage
} from 'lucide-react'
  const API_BASE_URL = 'https://5003-ifso0ycmvzfunyjvom75k-e8649773.manusvm.computer'

const QuickSubmit = ({ onSessionComplete }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    images: []
  })
  const [imagePreview, setImagePreview] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file]
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      images: []
    }))
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert('Please provide a description of the issue')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/diagnostic/quick-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: formData.location,
          description: formData.description
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        onSessionComplete(data.session)
        resetForm()
      } else {
        console.error('Quick submit failed:', data.error)
        alert('Failed to submit diagnostic request. Please try again.')
      }
    } catch (error) {
      console.error('Failed to submit quick diagnostic:', error)
      alert('Failed to submit diagnostic request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      location: '',
      description: '',
      images: []
    })
    setImagePreview(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing Your Request</h3>
          <p className="text-slate-600 text-center mb-4">
            Analyzing your description and generating diagnostic recommendations...
          </p>
          <Progress value={60} className="w-64" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Quick Submit
        </CardTitle>
        <CardDescription>
          Upload a photo and describe the issue for rapid AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-4">
          <Label>Equipment Photo (Optional)</Label>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <FileImage className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                Upload a photo of the equipment, error display, or problem area
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </Label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Equipment preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Unit Location (Optional)</Label>
          <Select 
            value={formData.location} 
            onValueChange={(value) => handleInputChange('location', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit location if known" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indoor">Indoor Unit</SelectItem>
              <SelectItem value="outdoor">Outdoor Unit</SelectItem>
              <SelectItem value="both">Both Units</SelectItem>
              <SelectItem value="unknown">Unknown/Not Sure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Problem Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Problem Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the issue in detail. Include when it started, what symptoms you're observing, any error codes, unusual sounds, smells, or visual indicators..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        {/* Safety Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Safety First:</strong> If you smell gas, see sparks, or detect burning odors, 
            stop work immediately and contact emergency services.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={resetForm}>
            Clear Form
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.description.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Diagnosis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickSubmit

