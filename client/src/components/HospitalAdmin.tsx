import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hospitalService } from "@/lib/hospitalService";
import { Plus, Save, MapPin } from "lucide-react";

const HospitalAdmin = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    specialty: '',
    opening_hours: '',
    latitude: 0,
    longitude: 0,
    rating: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Assuming hospitalService.addHospital is updated to handle the location string
      await hospitalService.addHospital({
        ...formData,
        specialty: formData.specialty.split(',').map(s => s.trim())
      });

      // Reset form
      setFormData({
        name: '',
        address: '',
        phone: '',
        specialty: '',
        opening_hours: '',
        latitude: 0,
        longitude: 0,
        rating: 0
      });
      setIsAdding(false);
      alert('Hospital added successfully!');
    } catch (error) {
      console.error('Error adding hospital:', error);
      alert('Failed to add hospital. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdding) {
    return (
      <div className="p-4">
        <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Hospital
        </Button>
      </div>
    );
  }

  return (
    <Card className="m-4">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Hospital</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hospital Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Specialties (comma-separated)</label>
            <Input
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              placeholder="Cardiology, Neurology, General Medicine"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opening Hours</label>
            <Input
              value={formData.opening_hours}
              onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
              placeholder="Mon-Fri: 9AM-6PM, Sat: 9AM-2PM"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                placeholder="e.g., 19.0760"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                placeholder="e.g., 72.8777"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Hospital'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default HospitalAdmin;