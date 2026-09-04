import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  User,
  Mail,
  GraduationCap,
  Building,
  ShieldCheck,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  BookOpen
} from 'lucide-react';

export default function ProfilePage() {
  const { profile } = useAuth();
  const isStudent = (profile?.role || '').toLowerCase() === 'student';

  return (
    <div className="space-y-7 animate-fade-in font-sans max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <User className="w-5 h-5" />
          </span>
          Institutional Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6763] font-medium mt-1">
          Academic credentials, official student identification, department affiliation, and security badge.
        </p>
      </div>

      {/* Main Identification Banner Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE3D8] shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="w-24 h-24 rounded-2xl bg-[#C85A32] flex items-center justify-center text-white text-3xl font-bold shadow-xs uppercase shrink-0 border-2 border-white">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>

        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-[#1C211F]">{profile?.full_name || 'Campus Member'}</h2>
              <p className="text-xs text-[#5E6763] font-medium mt-0.5">
                Computer Science & Engineering Department • Semester 5
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-end">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/30 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {profile?.role || 'Student'}
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20 capitalize">
                Status: {profile?.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F3ECE2]">
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EAE3D8]">
              <span className="text-[10px] uppercase font-bold text-[#8E9893] block">Roll / Institution ID</span>
              <span className="text-xs font-mono font-bold text-[#C85A32]">{profile?.institution_id || 'CSE-2023-0492'}</span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EAE3D8]">
              <span className="text-[10px] uppercase font-bold text-[#8E9893] block">Registered Email</span>
              <span className="text-xs font-medium text-[#1C211F] truncate block">{profile?.email || 'student@campus.edu'}</span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EAE3D8]">
              <span className="text-[10px] uppercase font-bold text-[#8E9893] block">Academic Batch</span>
              <span className="text-xs font-bold text-[#1C211F]">2022 - 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Academic Standing & Official Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Credentials Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D8] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1C211F] flex items-center gap-2 border-b border-[#F3ECE2] pb-3">
            <GraduationCap className="w-4 h-4 text-[#C85A32]" /> Academic Credentials
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-[#FAF7F2]">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-[#C85A32]" /> Degree Program
              </span>
              <span className="font-bold text-[#1C211F]">B.Tech in Computer Science</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#FAF7F2]">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <Building className="w-4 h-4 text-[#C85A32]" /> Academic Section
              </span>
              <span className="font-bold text-[#1C211F]">Section B • Morning Session</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#FAF7F2]">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-[#C85A32]" /> Current Enrollment
              </span>
              <span className="font-bold text-[#1C211F]">6 Theory & 2 Laboratory Courses</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#5E8C71]" /> Attendance Standing
              </span>
              <span className="font-bold text-[#5E8C71] bg-[#F0F6F2] px-2 py-0.5 rounded-md border border-[#5E8C71]/30">
                84.2% (Eligible for Exams)
              </span>
            </div>
          </div>
        </div>

        {/* Security & Access Badges */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D8] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1C211F] flex items-center gap-2 border-b border-[#F3ECE2] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#C85A32]" /> Security Credentials & Verification
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-[#FAF7F2]">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <CreditCard className="w-4 h-4 text-[#C85A32]" /> RFID Badge ID
              </span>
              <span className="font-mono font-bold text-[#1C211F]">RFID-882109-ACT</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#FAF7F2]">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#C85A32]" /> Enrollment Verified On
              </span>
              <span className="font-bold text-[#1C211F]">August 14, 2022</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#FAF7F2]">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#C85A32]" /> Authentication Provider
              </span>
              <span className="font-bold text-[#1C211F]">Campus Supabase Auth (JWT)</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[#5E6763] flex items-center gap-1.5 font-medium">
                <Mail className="w-4 h-4 text-[#C85A32]" /> Primary Communication
              </span>
              <span className="font-bold text-[#1C211F] truncate max-w-[180px]">{profile?.email || 'Verified'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
