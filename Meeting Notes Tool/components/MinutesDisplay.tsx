
import React from 'react';
// FIX: Corrected import to use MeetingMinutesData as defined in types.ts.
import type { MeetingMinutesData } from '../types';

interface MinutesDisplayProps {
  // FIX: Corrected prop type to use MeetingMinutesData.
  data: MeetingMinutesData;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
  <>
    <div className="px-4 py-3 bg-gray-100 font-bold text-sm text-gray-800 text-center border-b border-r">{label}</div>
    <div className={`px-4 py-3 text-sm text-gray-700 border-b ${fullWidth ? 'col-span-3' : ''}`}>{value}</div>
  </>
);

export const MinutesDisplay: React.FC<MinutesDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Main Meeting Minutes Section */}
      <div className="border border-gray-400">
        <h3 className="text-2xl font-bold text-center py-4 bg-gray-200 border-b border-gray-400">회 의 록</h3>
        <div className="grid grid-cols-4">
          <InfoRow label="지원기관" value={data.sponsoringOrganization} />
          <InfoRow label="지원 사업" value={data.supportProject} fullWidth={true} />
          <InfoRow label="일 시" value={`${data.date} ${data.time}`} />
          <InfoRow label="장 소" value={data.location} />
          <InfoRow label="안 건" value={data.agenda} fullWidth={true} />
          <InfoRow label="참석자" value={data.attendeeSummary} fullWidth={true} />
        </div>
        <div className="grid grid-cols-4 min-h-[150px]">
           <div className="px-4 py-3 bg-gray-100 font-bold text-sm text-gray-800 text-center border-r border-t">회의내용</div>
           <div className="px-4 py-3 text-sm text-gray-700 col-span-3 border-t">
                <ul className="list-disc list-inside space-y-1">
                    {data.meetingContent.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
           </div>
        </div>
        <div className="p-4 flex justify-center items-center gap-4 border-t border-gray-400">
          <span className="text-sm font-semibold">연구책임자 :</span>
          <span className="text-lg">{data.researcherInCharge}</span>
          <span className="font-serif text-2xl italic">(서명)</span>
        </div>
      </div>
      
      {/* Expense Section */}
      <div className="border border-gray-400">
          <h3 className="text-xl font-bold text-center py-3 bg-gray-200 border-b border-gray-400">영수증 첨부</h3>
          <div className="p-4 space-y-2">
            <p className="font-bold text-blue-600">청구금액 : {data.claimedAmount}</p>
            {data.attachments.map((item, index) => <p key={index} className="text-sm text-gray-600">- {item}</p>)}
          </div>
      </div>

      {/* Attendee List Section */}
      <div className="border border-gray-400">
        <h3 className="text-xl font-bold text-center py-3 bg-gray-200 border-b border-gray-400">회의 참석자 명부</h3>
        <div className="p-4">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-sm">순번</th>
                        <th className="border border-gray-300 p-2 text-sm">이름</th>
                        <th className="border border-gray-300 p-2 text-sm">소속</th>
                        <th className="border border-gray-300 p-2 text-sm">직책</th>
                        <th className="border border-gray-300 p-2 text-sm">서명</th>
                    </tr>
                </thead>
                <tbody>
                    {data.attendees.map((attendee, index) => (
                        <tr key={index} className="text-center">
                            <td className="border border-gray-300 p-2 text-sm">{index + 1}</td>
                            <td className="border border-gray-300 p-2 text-sm">{attendee.name}</td>
                            <td className="border border-gray-300 p-2 text-sm">{attendee.affiliation}</td>
                            <td className="border border-gray-300 p-2 text-sm">{attendee.position}</td>
                            <td className="border border-gray-300 p-2 text-sm font-serif italic">{attendee.name} (서명)</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
