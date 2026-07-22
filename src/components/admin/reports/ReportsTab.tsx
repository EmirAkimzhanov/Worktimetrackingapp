import React, { useState } from 'react';
import { TimesheetReports } from './TimeSheetReports';
import { LeaveReports } from './LeaveReports';
import { AttendanceReports } from './Attendance';

type TabType = 'timesheet' | 'leaves' | 'attendance';

export function ReportsTab() {
    const [activeTab, setActiveTab] = useState<TabType>('timesheet');

    return (
        <div className="space-y-6">
            {/* Tabs Header */}
            <div className="border-b border-gray-200">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('timesheet')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'timesheet'
                            ? 'text-blue-600 bg-blue-50 rounded-t-md border border-b-0 border-blue-200'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Timesheet Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'leaves'
                            ? 'text-blue-600 bg-blue-50 rounded-t-md border border-b-0 border-blue-200'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Leave Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'attendance'
                            ? 'text-blue-600 bg-blue-50 rounded-t-md border border-b-0 border-blue-200'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Attendance Reports
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'timesheet' && <TimesheetReports />}
            {activeTab === 'leaves' && <LeaveReports />}
            {activeTab === 'attendance' && <AttendanceReports />}
        </div>
    );
}