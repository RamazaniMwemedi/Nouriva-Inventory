'use client';

import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // Ensure this path matches your setup

interface Seller {
  sellerName: string;
  email: string;
  contactPhone: string;
  companyName: string | null;
  websiteUrl: string | null;
  address: string | null;
  country: string | null;
  id: number;
  role: string;
  passwordHash: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  profileUrl?: string | null;
}

interface PaymentMethod {
  methodType: 'card' | 'mpesa';
  id: number;
  userType: string;
  userId: number;
  cardHolderName: string;
  cardNumberLast4: string;
  cardToken: string;
  expiryMonth: number;
  expiryYear: number;
  mpesaPhoneNumber: string;
  mpesaFullName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EditableAccountProps {
  seller: Seller;
  paymentMethod?: PaymentMethod; // Optional, if no payment method exists yet
}

export default function EditableAccount({
  seller,
  paymentMethod
}: EditableAccountProps) {
  // Extracted fields for display
  const memberSince = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString()
    : 'Not provided';
  const [activeSection, setActiveSection] = useState<'personal' | 'billing'>(
    'personal'
  );

  // Profile Image State
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    seller.profileUrl || null
  );
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Editing states for various sections
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [isEditingOwnership, setIsEditingOwnership] = useState(false);
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);

  // Basic Info fields
  const [basicInfoName, setBasicInfoName] = useState(seller.sellerName || '');

  // Contact Info fields
  const [contactEmail, setContactEmail] = useState(seller.email || '');
  const [contactPhone, setContactPhone] = useState(seller.contactPhone || '');

  // Ownership fields
  const initialMemberSinceDate = seller.createdAt
    ? new Date(seller.createdAt).toISOString().split('T')[0]
    : '';
  const [ownershipAccountType, setOwnershipAccountType] = useState(
    seller.role || ''
  );
  const [ownershipMemberSince, setOwnershipMemberSince] = useState(
    initialMemberSinceDate
  );

  // Company Info fields
  const [companyNameState, setCompanyNameState] = useState(
    seller.companyName || ''
  );
  const [websiteUrlState, setWebsiteUrlState] = useState(
    seller.websiteUrl || ''
  );
  const [addressState, setAddressState] = useState(seller.address || '');
  const [companyCountryState, setCompanyCountryState] = useState(
    seller.country || ''
  );

  // Payment Method Fields
  const [currentMethodType, setCurrentMethodType] = useState<
    'card' | 'mpesa' | null
  >(paymentMethod?.methodType || null);
  const [cardHolderName, setCardHolderName] = useState(
    paymentMethod?.cardHolderName || ''
  );
  const [cardNumberLast4, setCardNumberLast4] = useState(
    paymentMethod?.cardNumberLast4 || ''
  );
  const [cardToken, setCardToken] = useState(paymentMethod?.cardToken || '');
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState(
    paymentMethod?.mpesaPhoneNumber || ''
  );
  const [mpesaFullName, setMpesaFullName] = useState(
    paymentMethod?.mpesaFullName || ''
  );
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  function displayField(value: string | null, placeholder = 'Not provided') {
    return value && value.trim() !== '' ? value : placeholder;
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProfileImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadProfileImageToFirebase(file: File): Promise<string> {
    const fileName = `profiles/${seller.id}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  async function updateSeller(
    body: Record<string, unknown>,
    onSuccess: () => void
  ) {
    const response = await fetch('/api/seller/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      setIsError(false);
      setStatusMessage('Updated successfully!');
      onSuccess();
      window.location.reload();
    } else {
      setIsError(true);
      setStatusMessage('Failed to update. Please try again.');
    }
  }

  async function updatePaymentMethod(
    body: Record<string, unknown>,
    onSuccess: () => void
  ) {
    const response = await fetch('/api/payment/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_type: 'seller',
        user_id: seller.id,
        ...body
      })
    });

    if (response.ok) {
      setIsError(false);
      setStatusMessage('Payment method updated successfully!');
      onSuccess();
      window.location.reload();
    } else {
      setIsError(true);
      setStatusMessage('Failed to update payment method. Please try again.');
    }
  }

  async function handleSaveImage() {
    if (!newProfileImage) return;
    try {
      const profileUrl = await uploadProfileImageToFirebase(newProfileImage);
      const body = { profileUrl };
      await updateSeller(body, () => {
        setIsEditingImage(false);
        setNewProfileImage(null);
      });
    } catch (error) {
      setIsError(true);
      setStatusMessage('Failed to upload image. Please try again.');
    }
  }

  async function handleSaveBasicInfo() {
    const body = { sellerName: basicInfoName };
    await updateSeller(body, () => {
      setIsEditingBasicInfo(false);
    });
  }

  async function handleSaveContactInfo() {
    const body = { email: contactEmail, contactPhone };
    await updateSeller(body, () => {
      setIsEditingContactInfo(false);
    });
  }

  async function handleSaveOwnership() {
    const updatedDate = ownershipMemberSince
      ? new Date(ownershipMemberSince)
      : null;
    const body = {
      role: ownershipAccountType,
      createdAt: updatedDate ? updatedDate.toISOString() : null
    };
    await updateSeller(body, () => {
      setIsEditingOwnership(false);
    });
  }

  async function handleSaveCompanyInfo() {
    const body = {
      companyName: companyNameState,
      websiteUrl: websiteUrlState,
      address: addressState,
      country: companyCountryState
    };
    await updateSeller(body, () => {
      setIsEditingCompanyInfo(false);
    });
  }

  async function handleSavePayment() {
    if (!currentMethodType) {
      setIsError(true);
      setStatusMessage('Please select a payment method type first.');
      return;
    }

    let body: Record<string, unknown> = {
      methodType: currentMethodType
    };

    if (currentMethodType === 'card') {
      body.cardHolderName = cardHolderName;
      body.cardToken = cardToken;
      body.cardNumberLast4 = cardNumberLast4;
    } else if (currentMethodType === 'mpesa') {
      body.mpesaPhoneNumber = mpesaPhoneNumber;
      body.mpesaFullName = mpesaFullName;
    }

    await updatePaymentMethod(body, () => {
      setIsEditingPayment(false);
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-r border-gray-200 p-6 flex flex-col items-center relative">
        <div className="relative mb-4 w-32 h-32 rounded-sm overflow-hidden bg-gray-200">
          {profileImagePreview ? (
            <img
              src={profileImagePreview}
              alt="Profile"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No Image
            </div>
          )}
          {!isEditingImage && (
            <button
              className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-50"
              onClick={() => setIsEditingImage(true)}
              title="Change Image"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M2.5 12H3m18 0h.5M12 2v.5m0 18v.5M4.929 4.929l.353.354M18.718 18.718l.354.354M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>
          )}
        </div>

        {isEditingImage && (
          <div className="mb-4 w-full text-center space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Change Photo
            </label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <div className="flex justify-center space-x-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                disabled={!newProfileImage}
                onClick={handleSaveImage}
              >
                Save
              </button>
              <button
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
                onClick={() => {
                  setIsEditingImage(false);
                  setNewProfileImage(null);
                  setProfileImagePreview(seller.profileUrl || null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-1 text-gray-800">
          {displayField(seller.companyName, 'Company Name')}
        </h2>

        <nav className="w-full space-y-2 mt-4">
          <button
            className={`w-full text-left py-2 px-3 rounded hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2 ${
              activeSection === 'personal' ? 'bg-gray-100' : ''
            }`}
            onClick={() => setActiveSection('personal')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-shop"
              viewBox="0 0 16 16"
            >
              <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0M1.5 8.5A.5.5 0 0 1 2 9v6h1v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h6V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5M4 15h3v-5H4zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm3 0h-2v3h2z" />
            </svg>
            Personal Info
          </button>
          <button
            className={`w-full text-left py-2 px-3 rounded hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2 ${
              activeSection === 'billing' ? 'bg-gray-100' : ''
            }`}
            onClick={() => setActiveSection('billing')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-credit-card-2-front"
              viewBox="0 0 16 16"
            >
              <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
              <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5" />
            </svg>
            Billing & Payments
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          >
            {statusMessage}
          </div>
        )}
        {activeSection === 'personal' && (
          <>
            <h1 className="text-3xl font-semibold mb-6 text-gray-800">
              Personal Info
            </h1>

            {/* Cards for Basic Info, Contact Info, Company Info, and Ownership */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <h2 className="text-xl font-medium mb-2 text-gray-800">
                  Basic Info
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Certain information will be accessible to others using these
                  services.
                </p>
                {isEditingBasicInfo ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={basicInfoName}
                        onChange={(e) => setBasicInfoName(e.target.value)}
                      />
                    </div>

                    <div className="mt-4 flex space-x-3">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={handleSaveBasicInfo}
                      >
                        Save Changes
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => {
                          setIsEditingBasicInfo(false);
                          setBasicInfoName(seller.sellerName || '');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Name</span>
                      <span>{displayField(seller.sellerName)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">Gender</span>
                      <span>Not provided</span>
                    </div>
                  </div>
                )}
                {!isEditingBasicInfo && (
                  <button
                    className="absolute top-6 right-6 text-sm text-blue-600 hover:underline"
                    onClick={() => setIsEditingBasicInfo(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Contact Info Card (Email, Phone only) */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <h2 className="text-xl font-medium mb-2 text-gray-800">
                  Contact Info
                </h2>
                {isEditingContactInfo ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>

                    <div className="mt-4 flex space-x-3">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={handleSaveContactInfo}
                      >
                        Save Changes
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => {
                          setIsEditingContactInfo(false);
                          setContactEmail(seller.email || '');
                          setContactPhone(seller.contactPhone || '');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Email</span>
                      <span>{displayField(seller.email)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone</span>
                      <span>{displayField(seller.contactPhone)}</span>
                    </div>
                  </div>
                )}
                {!isEditingContactInfo && (
                  <button
                    className="absolute top-6 right-6 text-sm text-blue-600 hover:underline"
                    onClick={() => setIsEditingContactInfo(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Company Info Card (Company Name, Website URL, Address, Country) */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <h2 className="text-xl font-medium mb-2 text-gray-800">
                  Company Info
                </h2>
                {isEditingCompanyInfo ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={companyNameState}
                        onChange={(e) => setCompanyNameState(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Website URL
                      </label>
                      <input
                        type="url"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={websiteUrlState}
                        onChange={(e) => setWebsiteUrlState(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={companyCountryState}
                        onChange={(e) => setCompanyCountryState(e.target.value)}
                      />
                    </div>

                    <div className="mt-4 flex space-x-3">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={handleSaveCompanyInfo}
                      >
                        Save Changes
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => {
                          setIsEditingCompanyInfo(false);
                          setCompanyNameState(seller.companyName || '');
                          setWebsiteUrlState(seller.websiteUrl || '');
                          setAddressState(seller.address || '');
                          setCompanyCountryState(seller.country || '');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Company Name</span>
                      <span>{displayField(seller.companyName)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Website URL</span>
                      <span>{displayField(seller.websiteUrl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Address</span>
                      <span>{displayField(seller.address)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Country</span>
                      <span>{displayField(seller.country)}</span>
                    </div>
                  </div>
                )}
                {!isEditingCompanyInfo && (
                  <button
                    className="absolute top-6 right-6 text-sm text-blue-600 hover:underline"
                    onClick={() => setIsEditingCompanyInfo(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Account Ownership Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <h2 className="text-xl font-medium mb-2 text-gray-800">
                  Account Ownership
                </h2>
                {isEditingOwnership ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Type
                      </label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={ownershipAccountType}
                        onChange={(e) =>
                          setOwnershipAccountType(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Member Since
                      </label>
                      <input
                        type="date"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={ownershipMemberSince}
                        onChange={(e) =>
                          setOwnershipMemberSince(e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-4 flex space-x-3">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={handleSaveOwnership}
                      >
                        Save Changes
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => {
                          setIsEditingOwnership(false);
                          setOwnershipAccountType(seller.role || '');
                          setOwnershipMemberSince(initialMemberSinceDate);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Account Type</span>
                      <span>{displayField(seller.role)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Member Since</span>
                      <span>{memberSince}</span>
                    </div>
                  </div>
                )}
                {!isEditingOwnership && (
                  <button
                    className="absolute top-6 right-6 text-sm text-blue-600 hover:underline"
                    onClick={() => setIsEditingOwnership(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {activeSection === 'billing' && (
          <>
            <h1 className="text-3xl font-semibold mb-6 text-gray-800">
              Billing & Payments
            </h1>

            {!isEditingPayment ? (
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    Selected Payment Method
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={currentMethodType === 'card'}
                        onChange={() => setCurrentMethodType('card')}
                      />
                      Credit Card
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={currentMethodType === 'mpesa'}
                        onChange={() => setCurrentMethodType('mpesa')}
                      />
                      M-Pesa
                    </label>
                  </div>
                </div>

                {currentMethodType === 'card' && (
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h2 className="font-semibold text-lg mb-2">
                      Credit Card Details
                    </h2>
                    <p>
                      <strong>Holder Name:</strong>{' '}
                      {displayField(cardHolderName)}
                    </p>
                    <p>
                      <strong>Card Number:</strong>{' '}
                      {displayField(cardNumberLast4)}
                    </p>
                    <button
                      className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded"
                      onClick={() => setIsEditingPayment(true)}
                    >
                      Edit
                    </button>
                  </div>
                )}

                {currentMethodType === 'mpesa' && (
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h2 className="font-semibold text-lg mb-2">
                      M-Pesa Details
                    </h2>
                    <p>
                      <strong>Phone Number:</strong>{' '}
                      {displayField(mpesaPhoneNumber)}
                    </p>
                    <p>
                      <strong>Full Name:</strong> {displayField(mpesaFullName)}
                    </p>
                    <button
                      className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded"
                      onClick={() => setIsEditingPayment(true)}
                    >
                      Edit
                    </button>
                  </div>
                )}

                {!currentMethodType && (
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <p>No payment method selected.</p>
                    <button
                      className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded"
                      onClick={() => setIsEditingPayment(true)}
                    >
                      Add Payment Method
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-md shadow-sm space-y-4">
                {currentMethodType === 'card' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                    />

                    <label className="block text-sm font-medium text-gray-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={cardNumberLast4}
                      onChange={(e) => setCardNumberLast4(e.target.value)}
                      maxLength={16}
                    />

                    <label className="block text-sm font-medium text-gray-700">
                      Card Token
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={cardToken}
                      onChange={(e) => setCardToken(e.target.value)}
                    />
                  </>
                )}

                {currentMethodType === 'mpesa' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={mpesaPhoneNumber}
                      onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                    />

                    <label className="block text-sm font-medium text-gray-700">
                      M-Pesa Full Name
                    </label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={mpesaFullName}
                      onChange={(e) => setMpesaFullName(e.target.value)}
                    />
                  </>
                )}

                <div className="mt-4 flex space-x-3">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={handleSavePayment}
                  >
                    Save
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    onClick={() => {
                      setIsEditingPayment(false);
                      // Reset to original props since we rely on parent props
                      setCardHolderName(paymentMethod?.cardHolderName || '');
                      setCardNumberLast4(paymentMethod?.cardNumberLast4 || '');
                      setCardToken(paymentMethod?.cardToken || '');
                      setMpesaPhoneNumber(
                        paymentMethod?.mpesaPhoneNumber || ''
                      );
                      setMpesaFullName(paymentMethod?.mpesaFullName || '');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
