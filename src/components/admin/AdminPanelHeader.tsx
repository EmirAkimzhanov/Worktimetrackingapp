import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Settings, Plus, Calendar } from 'lucide-react';

interface AdminPanelHeaderProps {
    activeTab: 'projects' | 'users' | 'clients' | 'calendar' | 'teams' | 'department' | 'reprots' | 'monitoring';
    onTabChange: (tab: 'projects' | 'users' | 'clients' | 'calendar' | 'teams' | 'department' | 'reprots' | 'monitoring') => void;
    onAddClick: () => void;
}

export function AdminPanelHeader({ activeTab, onTabChange, onAddClick }: AdminPanelHeaderProps) {
    const getAddButtonLabel = () => {
        switch (activeTab) {
            case 'projects': return 'Project';
            case 'users': return 'User';
            case 'clients': return 'Client';
            // case 'settings': return 'Settings';
            case 'teams': return 'Team';
            case 'department': return 'Tasks';
            case 'reprots': return 'Reports'
            case 'monitoring': return 'Monitoring'
            default: return 'Item';
        }
    };

    const tabs = [
        { id: 'projects', label: 'Projects' },
        { id: 'users', label: 'Users' },
        { id: 'clients', label: 'Clients' },
        { id: 'settings', label: 'Settings' },
        { id: 'reports', label: 'Reports' },
        { id: 'monitoring', label: 'Monitoring' },



    ];

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
                        {tabs.map((tab) => (
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
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* <Button
                        onClick={onAddClick}
                        style={{ backgroundColor: '#00A3A1' }}
                        className="hover:opacity-90"
                        disabled={activeTab === 'calendar'}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add {getAddButtonLabel()}
                    </Button> */}
                </div>
            </div>
        </CardHeader >
    );
}