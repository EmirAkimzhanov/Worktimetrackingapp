import React, { useState } from 'react';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Settings, Plus, Calendar, ChevronDown } from 'lucide-react';

interface AdminPanelHeaderProps {
    activeTab: 'projects' | 'users' | 'clients' | 'setiings' | 'country' | 'calendar' | 'pie' | 'serviceType' | 'teams' | 'department' | 'reports' | 'monitoring' | 'sectors' | 'service-line' | 'project-status' | 'monitoring';
    onTabChange: (tab: 'projects' | 'users' | 'clients' | 'settings' | 'calendar' | 'pie' | 'serviceType' | 'teams' | 'department' | 'reports' | 'monitoring' | 'sectors' | 'service-line' | 'project-status') => void;
    onAddClick: () => void;
}

export function AdminPanelHeader({ activeTab, onTabChange, onAddClick }: AdminPanelHeaderProps) {
    const [showMoreTabs, setShowMoreTabs] = useState(false);

    const getAddButtonLabel = () => {
        switch (activeTab) {
            case 'projects': return 'Project';
            case 'users': return 'User';
            case 'clients': return 'Client';
            case 'country': return 'Countries';
            case 'teams': return 'Team';
            case 'pie': return 'Pie';
            case 'serviceType': return 'Service type';
            case 'department': return 'Tasks';
            case 'reports': return 'Reports';
            case 'monitoring': return 'Monitoring';
            default: return 'Item';
        }
    };

    // Показываем первые 5 табов (добавил reprots)
    const visibleTabs = [
        { id: 'projects', label: 'Projects' },
        { id: 'users', label: 'Users' },
        { id: 'clients', label: 'Clients' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'reports', label: 'Reports' },
        { id: 'monitoring', label: 'Monitoring' },
        { id: 'settings', label: 'Settings' },

    ];

    // Остальные табы в меню More (убрал reprots отсюда)
    const moreTabs = [
        { id: 'country', label: 'Countries' },
        { id: 'teams', label: 'Teams' },
        { id: 'department', label: 'Department' },
        { id: 'monitoring', label: 'Monitoring' },
        { id: 'pie', label: 'Pie' },
        { id: 'serviceType', label: 'Service-Type' },
        { id: 'sectors', label: 'Sectors' },
        { id: 'service-line', label: 'Service-line' },
        { id: 'project-status', label: 'Project-status' },




    ];

    const isMoreTabActive = moreTabs.some(tab => tab.id === activeTab);

    return (
        <CardHeader style={{ backgroundColor: '#1F4E78' }} className="text-white border-b">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Settings className="w-5 h-5" />
                        System Administration
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                        Manage projects, users, clients, calendar, and teams
                    </CardDescription>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex gap-1 bg-transparent border border-blue-300 rounded-lg p-1">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id as any)}
                                className={`
                                    flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                                    ${activeTab === tab.id
                                        ? 'bg-white text-primary font-medium'
                                        : 'text-blue-100 hover:text-black hover:bg-blue-600/50'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}

                        {/* Кнопка More */}
                        <div className="relative" style={{ zIndex: 9999 }}>
                            {/* <button
                                onClick={() => setShowMoreTabs(!showMoreTabs)}
                                className={`
                                    flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                                    ${isMoreTabActive
                                        ? 'bg-white text-primary font-medium'
                                        : 'text-blue-100 hover:text-black hover:bg-blue-600/50'
                                    }
                                `}
                            >
                                More
                                <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showMoreTabs ? 'rotate-180' : ''}`} />
                            </button> */}

                            {showMoreTabs && (
                                <>
                                    <div
                                        style={{ width: '70px' }}
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMoreTabs(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1" style={{ width: '110px' }}>
                                        {moreTabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    onTabChange(tab.id as any);
                                                    setShowMoreTabs(false);
                                                }}
                                                className={`
                                                    w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                                                    ${activeTab === tab.id ? 'bg-blue-50 text-primary' : 'text-primary'}
                                                `}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* <Button onClick={onAddClick} className="bg-white text-primary hover:bg-gray-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Add {getAddButtonLabel()}
                    </Button> */}
                </div>
            </div>
        </CardHeader>
    );
}