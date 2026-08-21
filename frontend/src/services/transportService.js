import { supabase } from './supabaseClient.js';
import { notificationService } from './notificationService.js';

export const transportService = {
  async getRoutesAndBuses() {
    const { data: routes, error: rErr } = await supabase
      .from('transport_routes')
      .select('*, buses(*)')
      .order('route_name');

    if (rErr) throw rErr;
    return routes || [];
  },

  async createRoute(payload) {
    const { data, error } = await supabase
      .from('transport_routes')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async assignBus(payload) {
    const busRecord = {
      bus_number: payload.bus_number || 'BUS-101',
      route_id: payload.route_id,
      capacity: payload.capacity ? Number(payload.capacity) : 50,
      driver_name: payload.driver_name || 'Driver Officer',
      driver_phone: payload.driver_phone || '+91 9876543210'
    };

    const { data, error } = await supabase
      .from('buses')
      .upsert(busRecord, { onConflict: 'bus_number' })
      .select('*, transport_routes(*)')
      .single();

    if (error) throw error;

    // Broadcast notification to all students
    try {
      const routeName = data?.transport_routes?.route_name || 'Campus Route';
      await notificationService.notifyAllStudents(
        'Transport Route & Bus Updated',
        `Bus ${data.bus_number} assigned to ${routeName}. Driver: ${data.driver_name} (${data.driver_phone}).`,
        'info'
      );
    } catch (nErr) {
      console.warn('Transport notification error:', nErr);
    }

    return data;
  }
};
