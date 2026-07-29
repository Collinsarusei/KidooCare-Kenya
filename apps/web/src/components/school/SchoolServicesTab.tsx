import React, { useState } from 'react';
import { ServiceDto } from '@daycare/shared-types';

interface SchoolServicesTabProps {
  myServices: ServiceDto[];
  schoolName?: string;
  onSaveService: (name: string, description: string, price: number, capacity: number) => void;
  onUpdateService?: (serviceId: string, name: string, description: string, price: number, capacity: number) => void;
}

export const SchoolServicesTab: React.FC<SchoolServicesTabProps> = ({
  myServices,
  schoolName = 'Sunshine Daycare',
  onSaveService,
  onUpdateService,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(2500);
  const [capacity, setCapacity] = useState<number | ''>(30);

  // Initial Mock Sample Services matching Image 1 if database is empty
  const defaultServices: Array<Partial<ServiceDto> & { waitlistCount?: number }> = [
    {
      id: 'default-1',
      name: 'Full Day Care',
      description: 'Comprehensive care from 8 AM to 6 PM, including meals and structured activities.',
      price: 2500,
      capacity: 30,
      currentEnrollmentCount: 24,
    },
    {
      id: 'default-2',
      name: 'Half Day (Morning)',
      description: 'Morning session from 8 AM to 1 PM. Includes mid-morning snack.',
      price: 1500,
      capacity: 15,
      currentEnrollmentCount: 15,
      waitlistCount: 3,
    },
    {
      id: 'default-3',
      name: 'After School Club',
      description: 'Homework help and activities from 3 PM to 6 PM. Transport available.',
      price: 1000,
      capacity: 20,
      currentEnrollmentCount: 8,
    },
  ];

  const displayServices = myServices.length > 0 ? myServices : (defaultServices as ServiceDto[]);

  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setName('');
    setDescription('');
    setPrice(2500);
    setCapacity(30);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (svc: ServiceDto) => {
    setEditingServiceId(svc.id);
    setName(svc.name);
    setDescription(svc.description || '');
    setPrice(svc.price);
    setCapacity(svc.capacity);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || capacity === '') return;

    if (editingServiceId && onUpdateService) {
      onUpdateService(editingServiceId, name, description, Number(price), Number(capacity));
    } else {
      onSaveService(name, description, Number(price), Number(capacity));
    }

    setIsModalOpen(false);
  };

  return (
    <div className="w-full mx-auto space-y-6 font-sans pb-20 animate-fadeIn">

      {/* Page Title & Add Button (Mockup 1 Match) */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#121c2a] font-display tracking-tight">
            Manage Services
          </h2>
          <p className="text-xs text-[#737686] mt-0.5">
            Configure offerings and pricing for {schoolName}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-11 h-11 rounded-2xl bg-[#004ac6] hover:bg-[#003ea8] text-white flex items-center justify-center text-2xl font-bold shadow-md transition-all shrink-0"
          title="Add New Service"
        >
          +
        </button>
      </div>

      {/* SERVICES LIST CARDS (EXACT MATCH FOR MOCKUP 1) */}
      <div className="space-y-4">
        {displayServices.map((svc) => {
          const enrolled = svc.currentEnrollmentCount || 0;
          const cap = svc.capacity || 10;
          const fillRatio = Math.min(1, enrolled / cap);
          const isFull = enrolled >= cap;
          const waitlistCount = (svc as any).waitlistCount || (isFull ? 3 : 0);

          // Color calculation matching Image 1
          let progressColor = 'bg-[#00714d]'; // Green for normal
          let indicatorColor = 'bg-[#00714d]';
          if (fillRatio >= 1) {
            progressColor = 'bg-[#92400e]'; // Brown/Amber for 100% full
            indicatorColor = 'bg-[#92400e]';
          } else if (fillRatio < 0.5) {
            progressColor = 'bg-[#004ac6]'; // Blue for low fill
            indicatorColor = 'bg-[#004ac6]';
          }

          return (
            <div
              key={svc.id}
              className="bg-white border border-[#e6eeff] rounded-3xl p-6 shadow-sm space-y-4 hover:border-[#b4c5ff] transition-all"
            >
              {/* Card Header & Edit Icon */}
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-extrabold text-[#121c2a] font-display">
                  {svc.name}
                </h3>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(svc)}
                  className="text-[#434655] hover:text-[#004ac6] p-1 transition-colors"
                  title="Edit Service"
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
              </div>

              {/* Service Description */}
              <p className="text-xs text-[#525666] leading-relaxed">
                {svc.description || 'Flexible care options for your child.'}
              </p>

              {/* Price Display */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-[#004ac6] font-display">
                  KES {svc.price?.toLocaleString()}
                </span>
                <span className="text-xs font-normal text-[#737686]">/day</span>
              </div>

              {/* Divider */}
              <div className="border-t border-[#f1f5f9] pt-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#434655]">Capacity</span>
                  <span className="font-bold text-[#121c2a] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${indicatorColor}`}></span>
                    {enrolled}/{cap} Filled
                  </span>
                </div>

                {/* Custom Progress Bar */}
                <div className="w-full h-2.5 bg-[#e6eeff] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${fillRatio * 100}%` }}
                  />
                </div>

                {/* Waitlist Badge if Full */}
                {isFull && waitlistCount > 0 && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#eff4ff] text-[#004ac6] px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-xs">group</span>
                      {waitlistCount} on Waitlist
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-[480px] max-w-full p-6 md:p-7 shadow-2xl space-y-5 border border-[#e6eeff] animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[#e6eeff] pb-4">
              <h3 className="text-xl font-extrabold text-[#121c2a] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6]">
                  {editingServiceId ? 'edit_note' : 'add_circle'}
                </span>
                {editingServiceId ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-[#f8f9ff] text-[#737686] hover:bg-[#e6eeff] flex items-center justify-center font-bold"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Day Care"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe timing, meals, activities included..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                    Price per Day (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="2500"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none font-bold text-[#004ac6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121c2a] uppercase tracking-wider mb-1.5">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="30"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-3 text-xs rounded-xl border border-[#cbd5e1] bg-[#f8f9ff] focus:ring-2 focus:ring-[#004ac6] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  className="btn bg-[#eff4ff] text-[#004ac6] text-xs font-bold py-3 px-5 rounded-full hover:bg-[#e6eeff]"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-extrabold py-3 px-6 rounded-full shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {editingServiceId ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
