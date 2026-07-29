import React, { useState, useEffect } from 'react';
import {
  UserRole,
  SchoolDetailDto,
  ServiceDto,
  PublicSchoolListingDto,
  ChildDto,
  EnrollmentDto,
  ParentLedgerSummaryDto,
  SchoolFinancialSummaryDto,
  AuditLogDto,
  ExecutiveSummaryReportDto,
  SchoolReviewSummaryDto,
  SchoolDocumentDto,
  DisputeDto,
  DisputeStatus,
} from '@daycare/shared-types';

import { Header } from './components/common/Header';
import { ReceiptModal, ReceiptData } from './components/common/ReceiptModal';
import { StkPushModal, StkInstallment } from './components/common/StkPushModal';
import { EnrollmentModal, EnrollingService } from './components/common/EnrollmentModal';
import { AuthBox } from './components/auth/AuthBox';
import { LandingView } from './components/landing/LandingView';

import { MarketplaceView } from './components/parent/MarketplaceView';
import { ChildrenView } from './components/parent/ChildrenView';
import { ParentEnrollmentsView } from './components/parent/ParentEnrollmentsView';
import { ParentLedgerView } from './components/parent/ParentLedgerView';
import { ParentDisputesView } from './components/parent/ParentDisputesView';

import { SchoolServicesTab } from './components/school/SchoolServicesTab';
import { SchoolRosterTab } from './components/school/SchoolRosterTab';
import { SchoolDocumentsTab } from './components/school/SchoolDocumentsTab';
import { SchoolFinancialsTab } from './components/school/SchoolFinancialsTab';
import { SchoolProfileTab } from './components/school/SchoolProfileTab';
import { SchoolProfileWizard } from './components/school/SchoolProfileWizard';
import { SchoolOverviewTab } from './components/school/SchoolOverviewTab';
import { SchoolDisputesTab } from './components/school/SchoolDisputesTab';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';

import { AdminDirectoryTab } from './components/admin/AdminDirectoryTab';
import { DocumentVerifyTab } from './components/admin/DocumentVerifyTab';
import { AdminDisputesTab } from './components/admin/AdminDisputesTab';
import { AuditLogsTab } from './components/admin/AuditLogsTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Marketplace & Browsing State
  const [publicSchools, setPublicSchools] = useState<PublicSchoolListingDto[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<PublicSchoolListingDto | null>(null);
  const [selectedSchoolReviews, setSelectedSchoolReviews] = useState<SchoolReviewSummaryDto | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Parent Dashboard State
  const [parentTab, setParentTab] = useState<'marketplace' | 'children' | 'enrollments' | 'ledger' | 'disputes'>('marketplace');
  const [myChildren, setMyChildren] = useState<ChildDto[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentDto[]>([]);
  const [parentLedger, setParentLedger] = useState<ParentLedgerSummaryDto | null>(null);
  const [parentDisputes, setParentDisputes] = useState<DisputeDto[]>([]);

  // Modals State
  const [enrollingService, setEnrollingService] = useState<EnrollingService | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [stkInstallment, setStkInstallment] = useState<StkInstallment | null>(null);
  const [stkPhone, setStkPhone] = useState('');
  const [stkResult, setStkResult] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Dispute Modal State
  const [disputeModalPayment, setDisputeModalPayment] = useState<{ id: string; amount: number; weekNumber: number; childName: string } | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Admin Dashboard State
  const [adminSchools, setAdminSchools] = useState<SchoolDetailDto[]>([]);
  const [adminTab, setAdminTab] = useState<'directory' | 'documents' | 'disputes' | 'audit'>('directory');
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [adminDocuments, setAdminDocuments] = useState<SchoolDocumentDto[]>([]);
  const [adminDisputes, setAdminDisputes] = useState<DisputeDto[]>([]);

  // School Manager Dashboard State
  const [mySchool, setMySchool] = useState<SchoolDetailDto | null>(null);
  const [myServices, setMyServices] = useState<ServiceDto[]>([]);
  const [schoolRoster, setSchoolRoster] = useState<EnrollmentDto[]>([]);
  const [schoolFinancials, setSchoolFinancials] = useState<SchoolFinancialSummaryDto | null>(null);
  const [schoolTab, setSchoolTab] = useState<'overview' | 'services' | 'roster' | 'documents' | 'financials' | 'disputes' | 'profile'>('overview');
  const [aiReport, setAiReport] = useState<ExecutiveSummaryReportDto | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [schoolDocuments, setSchoolDocuments] = useState<SchoolDocumentDto[]>([]);
  const [schoolDisputes, setSchoolDisputes] = useState<DisputeDto[]>([]);
  const [submittingDoc, setSubmittingDoc] = useState(false);

  useEffect(() => {
    fetchPublicMarketplace();
    if (token) {
      handleFetchMe();
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN) {
        fetchAdminSchools();
        fetchAdminDocuments();
        fetchAdminDisputes();
      } else if (currentUser.role === UserRole.SCHOOL && currentUser.school) {
        setMySchool(currentUser.school);
        fetchSchoolServices(currentUser.school.id);
        fetchSchoolRoster(currentUser.school.id);
        fetchSchoolFinancials(currentUser.school.id);
        fetchSchoolDocuments(currentUser.school.id);
        fetchSchoolDisputes();
      } else if (currentUser.role === UserRole.PARENT) {
        fetchMyChildren();
        fetchMyEnrollments();
        fetchParentLedger();
        fetchParentDisputes();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolReviews(selectedSchool.id);
    } else {
      setSelectedSchoolReviews(null);
    }
  }, [selectedSchool]);

  const fetchPublicMarketplace = async (query = '') => {
    try {
      const url = query ? `/api/public/schools?search=${encodeURIComponent(query)}` : '/api/public/schools';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setPublicSchools(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchSchoolReviews = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/reviews/school/${schoolId}`);
      const data = await res.json();
      if (res.ok) setSelectedSchoolReviews(data);
    } catch (e) {
      // ignore
    }
  };

  const handleFetchMe = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.status === 401) {
        // Token is expired or invalid — clear stale auth state
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setRefreshToken(null);
        return;
      }
      const data = await res.json();
      if (res.ok) setCurrentUser(data);
    } catch (e) {
      // Network error — leave token in place (server may be temporarily down)
    }
  };

  const fetchMyChildren = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/children', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyChildren(data);
        if (data.length > 0 && !selectedChildId) setSelectedChildId(data[0].id);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchMyEnrollments = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/enrollments/my', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setMyEnrollments(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchParentLedger = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/balances/my', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setParentLedger(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchParentDisputes = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/disputes/my', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setParentDisputes(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchSchoolRoster = async (schoolId: string) => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/enrollments`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setSchoolRoster(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchSchoolFinancials = async (schoolId: string) => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/balances`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setSchoolFinancials(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchSchoolDocuments = async (schoolId: string) => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}/documents`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setSchoolDocuments(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchAdminDocuments = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/admin/documents', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setAdminDocuments(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchAdminDisputes = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/disputes/admin', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setAdminDisputes(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchAdminSchools = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/admin/schools', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setAdminSchools(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchAuditLogs = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setAuditLogs(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchSchoolServices = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolId}/services`);
      const data = await res.json();
      if (res.ok) setMyServices(data);
    } catch (e) {
      // ignore
    }
  };

  const handleSubmitAuth = async (email: string, password: string, phone: string, isLogin: boolean) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { email, password, phone, role: UserRole.PARENT };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChild = async (name: string, dob: string, notes: string) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, dob, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register child');

      setSuccessMsg(`Child '${data.name}' registered successfully!`);
      fetchMyChildren();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingService || !selectedChildId) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          childId: selectedChildId,
          serviceId: enrollingService.serviceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Enrollment failed');

      const isWaitlisted = data.status === 'WAITLISTED';
      setSuccessMsg(
        isWaitlisted
          ? `Capacity reached! Child enrolled on WAITLIST for '${enrollingService.serviceName}'.`
          : `Successfully enrolled in '${enrollingService.serviceName}'! Weekly billing cycle generated.`
      );
      setEnrollingService(null);
      fetchMyEnrollments();
      fetchParentLedger();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInitiateStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkInstallment) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weeklyInstallmentId: stkInstallment.id,
          phone: stkPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'STK Push failed');

      setStkResult(data);
      setStkInstallment({ ...stkInstallment, paymentId: data.paymentId });
      setSuccessMsg(`M-Pesa STK Push sent to ${stkPhone}! Enter PIN on phone.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSimulateCallback = async () => {
    if (!stkResult || !stkInstallment) return;
    setError(null);

    try {
      const res = await fetch('/api/payments/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Body: {
            stkCallback: {
              CheckoutRequestID: stkResult.checkoutRequestId,
              ResultCode: 0,
              ResultDesc: 'The service request is processed successfully.',
              CallbackMetadata: {
                Item: [{ Name: 'MpesaReceiptNumber', Value: `RCK${Date.now().toString().slice(-6)}` }],
              },
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Callback simulation failed');

      setSuccessMsg('M-Pesa payment confirmed! Installment marked PAID and balance updated.');
      setStkInstallment(null);
      setStkResult(null);
      fetchMyEnrollments();
      fetchParentLedger();
      if (mySchool) fetchSchoolFinancials(mySchool.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateReview = async (schoolId: string, rating: number, comment: string) => {
    setError(null);
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schoolId, rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');

      setSuccessMsg('Thank you! Your review has been published.');
      fetchSchoolReviews(schoolId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUploadDocument = async (type: string, fileUrl: string) => {
    if (!mySchool) return;
    setError(null);
    setSubmittingDoc(true);

    try {
      const res = await fetch(`/api/schools/${mySchool.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, fileUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload document');

      setSuccessMsg('Verification document uploaded! Pending Admin verification review.');
      fetchSchoolDocuments(mySchool.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleVerifyDocument = async (docId: string, verified: boolean) => {
    setError(null);

    try {
      const res = await fetch(`/api/school-documents/${docId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verified }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to verify document');

      setSuccessMsg(verified ? 'Document verified! School granted Verified Badge ✓' : 'Document unverified.');
      fetchAdminDocuments();
      fetchAdminSchools();
      fetchPublicMarketplace();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePromoteWaitlist = async (enrollmentId: string) => {
    setError(null);

    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/promote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to promote enrollment');

      setSuccessMsg(`Child promoted to ACTIVE enrollment! Billing cycle initialized.`);
      if (mySchool) {
        fetchSchoolRoster(mySchool.id);
        fetchSchoolServices(mySchool.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEndEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to end this child enrollment?')) return;
    setError(null);

    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to end enrollment');

      setSuccessMsg('Enrollment status updated to ENDED.');
      if (currentUser?.role === UserRole.PARENT) fetchMyEnrollments();
      if (mySchool) {
        fetchSchoolRoster(mySchool.id);
        fetchSchoolServices(mySchool.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalPayment || !disputeReason) return;
    setError(null);
    setSubmittingDispute(true);

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: disputeModalPayment.id,
          reason: disputeReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to raise dispute');

      setSuccessMsg('Dispute ticket raised! Platform Admin will review your claim.');
      setDisputeModalPayment(null);
      setDisputeReason('');
      fetchParentDisputes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, status: DisputeStatus, resolutionNote: string) => {
    setError(null);

    try {
      const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, resolutionNote }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resolve dispute');

      setSuccessMsg(`Dispute updated to ${status}.`);
      fetchAdminDisputes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchSchoolDisputes = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/disputes/school', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok) setSchoolDisputes(data);
    } catch (e) {
      // ignore
    }
  };

  const handleSaveService = async (name: string, description: string, price: number, capacity: number) => {
    if (!mySchool) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/schools/${mySchool.id}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, price, capacity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create service');

      setSuccessMsg(`Program '${data.name}' created!`);
      fetchSchoolServices(mySchool.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateService = async (serviceId: string, name: string, description: string, price: number, capacity: number) => {
    if (!mySchool) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, price, capacity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update service');

      setSuccessMsg(`Program '${data.name}' updated!`);
      fetchSchoolServices(mySchool.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateProfile = async (
    payloadOrName: any,
    location?: string,
    about?: string,
  ) => {
    if (!mySchool) return;
    setError(null);
    setSuccessMsg(null);

    const bodyData =
      typeof payloadOrName === 'object'
        ? payloadOrName
        : { name: payloadOrName, location, about };

    try {
      const res = await fetch(`/api/schools/${mySchool.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile update failed');

      setMySchool(data);
      setSuccessMsg('School profile updated successfully!');
      fetchPublicMarketplace();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDraftProfileWithAi = async (name: string, location: string) => {
    if (!name) return;
    setError(null);
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/ai/draft-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolName: name,
          location,
          highlights: ['Infant Care (3-12m)', 'CCTV Security Monitoring', 'Nutritious Meals', 'Lipa Mdogo Mdogo Weekly Billing'],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Drafting failed');

      setSuccessMsg('✨ AI Profile overview drafted successfully!');
      return data.generatedAbout;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleGenerateExecutiveSummary = async () => {
    if (!mySchool) return;
    setError(null);
    setIsGeneratingAi(true);

    try {
      const res = await fetch(`/api/ai/executive-summary/${mySchool.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Report generation failed');

      setAiReport(data);
      setSuccessMsg('🤖 AI Executive Summary generated and saved!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleOnboardSchool = async (payload: {
    schoolName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
    location?: string;
    mpesaConsumerKey?: string;
    mpesaConsumerSecret?: string;
    mpesaShortcode?: string;
    mpesaPasskey?: string;
  }) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/schools/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'School onboarding failed');

      if (data.emailSent) {
        setSuccessMsg(`✅ Daycare '${data.name}' onboarded! Credentials email sent to ${payload.adminEmail} via Resend.`);
      } else {
        setSuccessMsg(
          `⚠️ Daycare '${data.name}' created, but email was NOT sent. ` +
          `Deliver credentials manually → Email: ${payload.adminEmail} | Password: ${payload.adminPassword}. ` +
          `(${data.emailMessage || 'Add RESEND_API_KEY to apps/api/.env'})`,
        );
      }
      fetchAdminSchools();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateSchoolCredentials = async (
    schoolId: string,
    credentials: {
      mpesaConsumerKey: string;
      mpesaConsumerSecret: string;
      mpesaShortcode: string;
      mpesaPasskey: string;
    }
  ) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/schools/${schoolId}/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update credentials');

      setSuccessMsg(`M-Pesa payment credentials updated!`);
      fetchAdminSchools();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete school');
      setSuccessMsg(`School '${schoolName}' has been permanently deleted.`);
      fetchAdminSchools();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleSchoolStatus = async (schoolId: string, currentStatus: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle school status');
      const action = currentStatus === 'SUSPENDED' ? 'reactivated' : 'deactivated';
      setSuccessMsg(`School successfully ${action}.`);
      fetchAdminSchools();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');

      setCurrentUser(data);
      setSuccessMsg('Password updated successfully! Welcome to KiddoCare Kenya.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
    setMySchool(null);
    setMyServices([]);
    setMyChildren([]);
    setMyEnrollments([]);
    setParentLedger(null);
    setSchoolFinancials(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const [activeView, setActiveView] = useState<'landing' | 'marketplace' | 'auth'>('landing');
  const [authPreset, setAuthPreset] = useState<{ role: UserRole; isRegistering: boolean }>({
    role: UserRole.PARENT,
    isRegistering: false,
  });

  const handleOpenAuth = (role: UserRole = UserRole.PARENT, isRegistering: boolean = false) => {
    setSelectedSchool(null);
    setAuthPreset({ role, isRegistering });
    setActiveView('auth');
  };

  const handleAuthSubmit = async (data: { emailOrPhone: string; password: string; role: UserRole; isRegistering: boolean; name?: string }) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const email = data.emailOrPhone.includes('@') 
        ? data.emailOrPhone 
        : `${data.emailOrPhone.replace(/\s+/g, '')}@kiddocare.co.ke`;
      const phone = data.emailOrPhone.includes('@') ? '+254700000000' : data.emailOrPhone;

      const endpoint = data.isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = data.isRegistering 
        ? { email, password: data.password, phone, role: data.role, name: data.name } 
        : { email, password: data.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Authentication failed');

      setToken(resData.accessToken);
      setRefreshToken(resData.refreshToken);
      setCurrentUser(resData.user);
      localStorage.setItem('token', resData.accessToken);
      localStorage.setItem('refreshToken', resData.refreshToken);

      setSuccessMsg(`Welcome, ${resData.user.email}!`);
      
      // Auto-fetch role specific data
      if (resData.user.role === UserRole.PARENT) {
        fetchMyChildren();
        fetchMyEnrollments();
        fetchParentLedger();
      } else if (resData.user.role === UserRole.SCHOOL) {
        handleFetchMe();
      } else if (resData.user.role === UserRole.ADMIN) {
        fetchAdminSchools();
        fetchAdminDocuments();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8f9ff]">
      {/* Global Header Bar */}
      {(!currentUser || currentUser.role !== UserRole.SCHOOL) && (
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onNavigateHome={() => setActiveView('landing')}
          onNavigateMarketplace={() => setActiveView('marketplace')}
          onOpenAuth={handleOpenAuth} 
          activeView={activeView}
        />
      )}

      {/* Custom School Header */}
      {currentUser && currentUser.role === UserRole.SCHOOL && (
        <header className="bg-white border-b border-[#e6eeff] px-4 md:px-8 py-3.5 shadow-sm sticky top-0 z-50 w-full">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">domain</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#004ac6] font-display">
                  {mySchool?.name || 'My Daycare'}
                </h2>
                {mySchool?.verifiedBadge && (
                  <span className="material-symbols-outlined text-xs text-[#16a34a]">verified</span>
                )}
              </div>
              <p className="text-xs text-[#737686]">
                Location: {mySchool?.location || 'Not set'}
              </p>
            </div>
          </div>
          
          {mySchool && mySchool.status !== ('PENDING_PROFILE' as any) && (
            <div className="flex bg-[#eff4ff] p-1 rounded-xl border border-[#e6eeff] overflow-x-auto gap-1 flex-1 md:flex-none">
              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'overview' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => setSchoolTab('overview')}
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span className="hidden lg:inline">Overview</span>
              </button>

              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'services' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => setSchoolTab('services')}
              >
                <span className="material-symbols-outlined text-base">tune</span>
                <span className="hidden lg:inline">Services ({myServices.length})</span>
              </button>

              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'roster' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => setSchoolTab('roster')}
              >
                <span className="material-symbols-outlined text-base">groups</span>
                <span className="hidden lg:inline">Roster ({schoolRoster.length})</span>
              </button>

              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'documents' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setSchoolTab('documents'); if (mySchool) fetchSchoolDocuments(mySchool.id); }}
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span className="hidden lg:inline">Documents ({schoolDocuments.length})</span>
              </button>

              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'financials' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setSchoolTab('financials'); if (mySchool) fetchSchoolFinancials(mySchool.id); }}
              >
                <span className="material-symbols-outlined text-base">analytics</span>
                <span className="hidden lg:inline">Financials</span>
              </button>

              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'disputes' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setSchoolTab('disputes'); fetchSchoolDisputes(); }}
              >
                <span className="material-symbols-outlined text-base">gavel</span>
                <span className="hidden lg:inline">Disputes ({schoolDisputes.length})</span>
              </button>

              <button 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  schoolTab === 'profile' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => setSchoolTab('profile')}
              >
                <span className="material-symbols-outlined text-base">edit</span>
                <span className="hidden lg:inline">Edit Profile</span>
              </button>
            </div>
          )}
          <button onClick={handleLogout} className="text-[#737686] hover:text-[#e11d48] transition-all flex items-center gap-1 text-sm font-bold shrink-0">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="hidden md:inline">Logout</span>
          </button>
          </div>
        </header>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">

      {/* Notifications */}
      {successMsg && (
        <div className="bg-[#e6f7ef] border border-[#6cf8bb] text-[#00714d] px-5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#00714d] font-bold">✕</button>
        </div>
      )}
      {error && (
        <div className="bg-[#fff7ed] border border-[#fdba74] text-[#c2410c] px-5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-[#c2410c] font-bold">✕</button>
        </div>
      )}

      {/* PUBLIC / LANDING VIEW FOR UNAUTHENTICATED USERS */}
      {!currentUser && (
        <>
          {activeView === 'landing' && (
            <LandingView
              onBrowseMarketplace={() => setActiveView('marketplace')}
              onOpenLogin={() => handleOpenAuth(UserRole.PARENT, false)}
              onOpenRegister={(role) => handleOpenAuth(role === 'SCHOOL' ? UserRole.SCHOOL : UserRole.PARENT, true)}
            />
          )}

          {activeView === 'marketplace' && (
            <MarketplaceView
              publicSchools={publicSchools}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSearch={fetchPublicMarketplace}
              selectedSchool={selectedSchool}
              setSelectedSchool={setSelectedSchool}
              selectedSchoolReviews={selectedSchoolReviews}
              currentUser={currentUser}
              onEnrollClick={(service) => handleOpenAuth(UserRole.PARENT, false)}
              onSubmitReview={handleCreateReview}
              submittingReview={submittingReview}
            />
          )}

          {activeView === 'auth' && (
            <AuthBox
              onSubmitAuth={handleAuthSubmit}
              loading={loading}
              initialRole={authPreset.role}
              initialRegistering={authPreset.isRegistering}
            />
          )}
        </>
      )}

      {/* PARENT DASHBOARD */}
      {currentUser && currentUser.role === UserRole.PARENT && (
        <div className="space-y-6">
          <div className="flex bg-white p-1.5 rounded-2xl border border-[#e6eeff] shadow-xs overflow-x-auto gap-1">
            <button 
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                parentTab === 'marketplace' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
              }`}
              onClick={() => setParentTab('marketplace')}
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              Daycare Marketplace
            </button>

            <button 
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                parentTab === 'children' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
              }`}
              onClick={() => setParentTab('children')}
            >
              <span className="material-symbols-outlined text-base">child_care</span>
              My Children ({myChildren.length})
            </button>

            <button 
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                parentTab === 'enrollments' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
              }`}
              onClick={() => setParentTab('enrollments')}
            >
              <span className="material-symbols-outlined text-base">assignment_turned_in</span>
              Active Enrollments ({myEnrollments.length})
            </button>

            <button 
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                parentTab === 'ledger' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
              }`}
              onClick={() => { setParentTab('ledger'); fetchParentLedger(); }}
            >
              <span className="material-symbols-outlined text-base">payments</span>
              Financial Ledger & Balances
            </button>

            <button 
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                parentTab === 'disputes' ? 'bg-[#004ac6] text-white shadow-sm' : 'text-[#737686] hover:text-[#121c2a]'
              }`}
              onClick={() => { setParentTab('disputes'); fetchParentDisputes(); }}
            >
              <span className="material-symbols-outlined text-base">flag</span>
              My Disputes ({parentDisputes.length})
            </button>
          </div>

          {parentTab === 'marketplace' && (
            <MarketplaceView
              publicSchools={publicSchools}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              onSearch={fetchPublicMarketplace}
              selectedSchool={selectedSchool}
              setSelectedSchool={setSelectedSchool}
              selectedSchoolReviews={selectedSchoolReviews}
              currentUser={currentUser}
              onEnrollClick={(service) => setEnrollingService(service)}
              onSubmitReview={handleCreateReview}
              submittingReview={submittingReview}
            />
          )}

          {parentTab === 'children' && (
            <ChildrenView myChildren={myChildren} onRegisterChild={handleCreateChild} />
          )}

          {parentTab === 'enrollments' && (
            <ParentEnrollmentsView myEnrollments={myEnrollments} />
          )}

          {parentTab === 'ledger' && (
            <ParentLedgerView
              parentLedger={parentLedger}
              onPayClick={(inst) => setStkInstallment(inst)}
              onViewReceipt={(receipt) => setReceiptData(receipt)}
              onFlagDispute={(payment) => setDisputeModalPayment(payment)}
            />
          )}

          {parentTab === 'disputes' && (
            <ParentDisputesView parentDisputes={parentDisputes} />
          )}
        </div>
      )}


      {/* FIRST LOGIN MANDATORY PASSWORD CHANGE MODAL */}
      {currentUser && currentUser.mustChangePassword && (
        <ChangePasswordModal
          userEmail={currentUser.email}
          onChangePassword={handleChangePassword}
        />
      )}

      {/* SCHOOL MANAGER DASHBOARD */}
      {currentUser && currentUser.role === UserRole.SCHOOL && (
        <div className="space-y-6">
          {/* PROFILE CREATION WIZARD (IF PENDING PROFILE) */}
          {mySchool && mySchool.status === ('PENDING_PROFILE' as any) ? (
            <SchoolProfileWizard
              mySchool={mySchool}
              onUpdateProfile={handleUpdateProfile}
              onDraftProfileWithAi={handleDraftProfileWithAi}
              isGeneratingAi={isGeneratingAi}
              onCompleteWizard={() => {
                if (mySchool) setMySchool({ ...mySchool, status: 'ACTIVE' as any });
                setSchoolTab('overview');
              }}
            />
          ) : (
            <>

          {schoolTab === 'overview' && (
            <SchoolOverviewTab
              financials={schoolFinancials}
              aiReport={aiReport}
              isGeneratingAi={isGeneratingAi}
              onGenerateAiReport={handleGenerateExecutiveSummary}
              onNavigateTab={(tab) => {
                if (tab === 'profile') setSchoolTab('profile');
                else if (tab === 'marketplace') setCurrentUser(null);
                else setSchoolTab('overview');
              }}
            />
          )}
          {schoolTab === 'services' && (
            <SchoolServicesTab
              myServices={myServices}
              schoolName={mySchool?.name}
              onSaveService={handleSaveService}
              onUpdateService={handleUpdateService}
            />
          )}
          {schoolTab === 'roster' && <SchoolRosterTab schoolRoster={schoolRoster} onPromoteWaitlist={handlePromoteWaitlist} onEndEnrollment={handleEndEnrollment} />}
          {schoolTab === 'documents' && <SchoolDocumentsTab schoolDocuments={schoolDocuments} onUploadDocument={handleUploadDocument} submittingDoc={submittingDoc} />}
          {schoolTab === 'financials' && <SchoolFinancialsTab schoolFinancials={schoolFinancials} aiReport={aiReport} isGeneratingAi={isGeneratingAi} onGenerateAiReport={handleGenerateExecutiveSummary} />}
          {schoolTab === 'disputes' && <SchoolDisputesTab disputes={schoolDisputes} onResolveDispute={handleResolveDispute} />}
          {schoolTab === 'profile' && (
            <SchoolProfileWizard
              mySchool={mySchool!}
              onUpdateProfile={handleUpdateProfile}
              onDraftProfileWithAi={handleDraftProfileWithAi}
              isGeneratingAi={isGeneratingAi}
              onCompleteWizard={() => setSchoolTab('overview')}
            />
          )}
            </>
          )}
        </div>
      )}

      {/* PLATFORM ADMIN DASHBOARD */}
      {currentUser && currentUser.role === UserRole.ADMIN && (
        <div className="space-y-6">
          <div className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#c2410c] text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#004ac6] font-display">
                  Platform Admin Console
                </h2>
                <p className="text-xs text-[#737686]">
                  Daycare Onboarding, Verification & System Audit Logging
                </p>
              </div>
            </div>

            <div className="flex bg-[#eff4ff] p-1 rounded-xl border border-[#e6eeff] overflow-x-auto gap-1">
              <button 
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminTab === 'directory' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setAdminTab('directory'); fetchAdminSchools(); }}
              >
                <span className="material-symbols-outlined text-base">domain</span>
                Directory ({adminSchools.length})
              </button>

              <button 
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminTab === 'documents' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setAdminTab('documents'); fetchAdminDocuments(); }}
              >
                <span className="material-symbols-outlined text-base">verified</span>
                Verification ({adminDocuments.length})
              </button>

              <button 
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminTab === 'disputes' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setAdminTab('disputes'); fetchAdminDisputes(); }}
              >
                <span className="material-symbols-outlined text-base">gavel</span>
                Disputes ({adminDisputes.length})
              </button>

              <button 
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminTab === 'audit' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#737686] hover:text-[#121c2a]'
                }`}
                onClick={() => { setAdminTab('audit'); fetchAuditLogs(); }}
              >
                <span className="material-symbols-outlined text-base">history</span>
                Audit Trail ({auditLogs.length})
              </button>
            </div>
          </div>

          {adminTab === 'directory' && (
            <AdminDirectoryTab 
              adminSchools={adminSchools} 
              onOnboardSchool={handleOnboardSchool} 
              onUpdateCredentials={handleUpdateSchoolCredentials}
              onDeleteSchool={handleDeleteSchool}
              onToggleSchoolStatus={handleToggleSchoolStatus}
            />
          )}
          {adminTab === 'documents' && <DocumentVerifyTab adminDocuments={adminDocuments} onVerifyDocument={handleVerifyDocument} />}
          {adminTab === 'disputes' && <AdminDisputesTab adminDisputes={adminDisputes} onResolveDispute={handleResolveDispute} />}
          {adminTab === 'audit' && <AuditLogsTab auditLogs={auditLogs} onRefresh={fetchAuditLogs} />}
        </div>
      )}

      {/* MODALS */}
      {enrollingService && (
        <EnrollmentModal
          enrollingService={enrollingService}
          myChildren={myChildren}
          selectedChildId={selectedChildId}
          setSelectedChildId={setSelectedChildId}
          onConfirm={handleConfirmEnrollment}
          onClose={() => setEnrollingService(null)}
        />
      )}

      {stkInstallment && (
        <StkPushModal
          stkInstallment={stkInstallment}
          stkPhone={stkPhone}
          stkResult={stkResult}
          setStkPhone={setStkPhone}
          onInitiate={handleInitiateStkPush}
          onSimulateCallback={handleSimulateCallback}
          onClose={() => { setStkInstallment(null); setStkResult(null); }}
        />
      )}

      {receiptData && (
        <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />
      )}

      {disputeModalPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-[500px] max-w-full p-6 md:p-8 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
              <h3 className="text-lg font-bold text-[#c2410c] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">flag</span>
                Flag Payment Dispute
              </h3>
              <button 
                className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] flex items-center justify-center" 
                onClick={() => setDisputeModalPayment(null)}
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#737686]">
              Flagging payment for <strong className="text-[#121c2a]">Week {disputeModalPayment.weekNumber}</strong> (KES {disputeModalPayment.amount.toLocaleString()}) for <strong className="text-[#004ac6]">{disputeModalPayment.childName}</strong>.
            </p>

            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1">
                  Reason for Dispute *
                </label>
                <textarea 
                  rows={3} 
                  required 
                  placeholder="Explain issue (e.g. Overpayment, school closure, duplicate M-Pesa push)..." 
                  value={disputeReason} 
                  onChange={(e) => setDisputeReason(e.target.value)} 
                  className="w-full text-xs p-3 rounded-xl border border-[#c3c6d7] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none" 
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  className="btn btn-secondary text-xs py-2 px-4 rounded-xl" 
                  onClick={() => setDisputeModalPayment(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary text-xs py-2 px-5 rounded-xl bg-[#c2410c] hover:bg-[#a13308] shadow-md flex items-center gap-1" 
                  disabled={submittingDispute}
                >
                  {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

