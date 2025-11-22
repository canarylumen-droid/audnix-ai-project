import React from 'react';
import { DashboardLayout } from '../components/dashboard-layout';
import { EmailSetupUI } from '../components/email-setup-ui';
import { CalendlyConnectUI } from '../components/calendly-connect-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage your integrations and preferences</p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">📧 Email</TabsTrigger>
            <TabsTrigger value="calendar">📅 Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Business Email Integration</CardTitle>
                <CardDescription>
                  Connect your SMTP email to start sending automatic follow-ups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailSetupUI />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Calendar & Booking</CardTitle>
                <CardDescription>
                  Connect Calendly or Google Calendar for automatic meeting scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendlyConnectUI />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
