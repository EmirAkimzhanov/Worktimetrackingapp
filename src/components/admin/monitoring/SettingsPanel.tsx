// components/monitoring/SettingsPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Bell, Mail, Clock, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function SettingsPanel() {
    const [settings, setSettings] = useState({
        enableAutoReminders: true,
        reminderFrequency: 'weekly',
        reminderDay: 'monday',
        reminderTime: '09:00',
        completionThreshold: 90,
        emailTemplate: `Dear {user_name},

This is a reminder to complete your time sheet for the period {period_start} to {period_end}.

Current completion: {completion_percentage}%

Please submit your time sheet by the deadline.

Best regards,
Management Team`,
        ccEmails: '',
        bccEmails: '',
    });

    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notification Settings
                    </CardTitle>
                    <CardDescription>
                        Configure automatic reminders and notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="auto-reminders">Enable Automatic Reminders</Label>
                            <p className="text-sm text-gray-500">
                                Send automatic reminders for incomplete time sheets
                            </p>
                        </div>
                        <Switch
                            id="auto-reminders"
                            checked={settings.enableAutoReminders}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enableAutoReminders: checked })
                            }
                        />
                    </div>

                    {settings.enableAutoReminders && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="frequency">Reminder Frequency</Label>
                                <Select
                                    value={settings.reminderFrequency}
                                    onValueChange={(value) =>
                                        setSettings({ ...settings, reminderFrequency: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="day">Reminder Day</Label>
                                <Select
                                    value={settings.reminderDay}
                                    onValueChange={(value) =>
                                        setSettings({ ...settings, reminderDay: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monday">Monday</SelectItem>
                                        <SelectItem value="tuesday">Tuesday</SelectItem>
                                        <SelectItem value="wednesday">Wednesday</SelectItem>
                                        <SelectItem value="thursday">Thursday</SelectItem>
                                        <SelectItem value="friday">Friday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time">Reminder Time</Label>
                                <Input
                                    type="time"
                                    id="time"
                                    value={settings.reminderTime}
                                    onChange={(e) =>
                                        setSettings({ ...settings, reminderTime: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="threshold">
                                    Completion Threshold ({settings.completionThreshold}%)
                                </Label>
                                <Input
                                    type="range"
                                    id="threshold"
                                    min="0"
                                    max="100"
                                    value={settings.completionThreshold}
                                    onChange={(e) =>
                                        setSettings({ ...settings, completionThreshold: parseInt(e.target.value) })
                                    }
                                />
                                <p className="text-sm text-gray-500">
                                    Send reminders if completion is below this percentage
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Template
                    </CardTitle>
                    <CardDescription>
                        Customize the email template for reminders
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="template">Email Template</Label>
                        <Textarea
                            id="template"
                            value={settings.emailTemplate}
                            onChange={(e) =>
                                setSettings({ ...settings, emailTemplate: e.target.value })
                            }
                            rows={8}
                            className="font-mono text-sm"
                        />
                        <div className="text-sm text-gray-500">
                            Available variables: {"{user_name}"}, {"{period_start}"}, {"{period_end}"}, {"{completion_percentage}"}, {"{missing_days}"}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cc">CC Emails (optional)</Label>
                            <Input
                                id="cc"
                                value={settings.ccEmails}
                                onChange={(e) =>
                                    setSettings({ ...settings, ccEmails: e.target.value })
                                }
                                placeholder="manager@company.com, hr@company.com"
                            />
                            <p className="text-sm text-gray-500">
                                Separate multiple emails with commas
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bcc">BCC Emails (optional)</Label>
                            <Input
                                id="bcc"
                                value={settings.bccEmails}
                                onChange={(e) =>
                                    setSettings({ ...settings, bccEmails: e.target.value })
                                }
                                placeholder="archive@company.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Settings
                </Button>
            </div>
        </div>
    );
}