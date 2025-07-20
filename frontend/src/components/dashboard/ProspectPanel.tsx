import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Star,
  ArrowUp,
  DollarSign
} from 'lucide-react';

interface ProspectData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  sponsorName: string;
  enrollmentDate: string;
  position: number;
  nextInLine: number;
}

interface SponsorInfo {
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  achievements: string[];
  totalTeamSize: number;
}

export const ProspectPanel: React.FC = () => {
  const [prospectData, setProspectData] = useState<ProspectData | null>(null);
  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(604800); // 7 days in seconds
  const [queuePosition, setQueuePosition] = useState<number>(847);
  const [totalEnrolled, setTotalEnrolled] = useState<number>(12543);
  const [recentCommissions, setRecentCommissions] = useState<number[]>([2840, 1750, 3200, 1890, 2650]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { days, hours, minutes, seconds: secs };
  };

  const timeLeft = formatTime(timeRemaining);

  // Mock data - connect to backend API
  useEffect(() => {
    // TODO: Replace with actual API calls
    setProspectData({
      id: 'P-2025-847',
      firstName: 'Your',
      lastName: 'Position',
      email: 'prospect@example.com',
      phone: '',
      city: 'Your City',
      state: 'State',
      country: 'Country',
      sponsorName: 'Kevin Gardner',
      enrollmentDate: '2025-07-19',
      position: 847,
      nextInLine: 153
    });

    setSponsorInfo({
      name: 'Kevin Gardner',
      email: 'kevin@magnificent.app',
      phone: '+1 (555) 123-4567',
      profileImage: '/avatars/kevin.jpg',
      achievements: ['Diamond Producer', 'Top Recruiter 2024', 'PowerLine Leader'],
      totalTeamSize: 1247
    });
  }, []);

  const progressPercentage = Math.min(100, (queuePosition / 1000) * 100);

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with Urgency Timer */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg shadow-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-bold">Priority Enrollment Window</h3>
                <p className="text-red-100 text-sm">Secure your position before it's too late!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </div>
              <p className="text-red-200 text-xs">Time Remaining</p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">PowerLine Prospect Dashboard</h1>
        <p className="text-slate-600">You're viewing position #{queuePosition} in the PowerLine queue</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main PowerLine Visualization - 60% Feature */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Your PowerLine Position</span>
              </CardTitle>
              <CardDescription>
                Live view of your position in the magnificent recruitment PowerLine
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* PowerLine Visualization */}
              <div className="bg-gradient-to-b from-blue-50 to-slate-50 p-6 rounded-lg mb-4">
                <div className="flex flex-col items-center space-y-4">
                  
                  {/* PowerLine Flow Visualization */}
                  <div className="w-full max-w-md">
                    <div className="flex flex-col space-y-2">
                      {/* Top positions */}
                      {[1, 2, 3, 4, 5].map((pos) => (
                        <div key={pos} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">#{pos}</Badge>
                            <span className="text-sm text-green-600 font-medium">ENROLLED</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            ${recentCommissions[pos - 1] || 0} earned
                          </div>
                        </div>
                      ))}
                      
                      {/* Gap indicator */}
                      <div className="text-center py-2">
                        <span className="text-xs text-slate-400">... {queuePosition - 10} more enrolled ...</span>
                      </div>
                      
                      {/* Your position area */}
                      <div className="bg-yellow-100 border-2 border-yellow-400 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="bg-yellow-600">#{queuePosition}</Badge>
                            <span className="font-bold text-yellow-800">YOUR POSITION</span>
                          </div>
                          <ArrowUp className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="mt-2 text-sm text-yellow-700">
                          {prospectData?.nextInLine} positions until enrollment eligibility
                        </div>
                      </div>
                      
                      {/* Future positions */}
                      {[1, 2, 3].map((offset) => (
                        <div key={offset} className="flex items-center justify-between bg-slate-100 p-2 rounded border-dashed border">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">#{queuePosition + offset}</Badge>
                            <span className="text-sm text-slate-500">WAITING</span>
                          </div>
                          <div className="text-xs text-slate-400">In queue</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Queue Progress</span>
                      <span className="text-sm text-slate-600">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">
                      {totalEnrolled} total enrolled • Position moves up as people enroll
                    </p>
                  </div>

                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Ready to Secure Your Position?</h4>
                    <p className="text-sm text-green-700">
                      Enroll now to start earning commissions and building your PowerLine team
                    </p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-6">
                    Enroll Now
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sponsor Information & Stats Sidebar */}
        <div className="space-y-6">
          
          {/* Sponsor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Your Sponsor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sponsorInfo && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={sponsorInfo.profileImage} alt={sponsorInfo.name} />
                      <AvatarFallback>
                        {sponsorInfo.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{sponsorInfo.name}</h4>
                      <p className="text-sm text-slate-600">Team Size: {sponsorInfo.totalTeamSize}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{sponsorInfo.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{sponsorInfo.phone}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Achievements:</p>
                    <div className="space-y-1">
                      {sponsorInfo.achievements.map((achievement, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Sponsor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Earnings Social Proof */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Recent Earnings</span>
              </CardTitle>
              <CardDescription>Live commission updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCommissions.map((amount, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Position #{index + 1}</span>
                    </div>
                    <span className="font-semibold text-green-700">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  These are real earnings from current PowerLine members!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm">Review PowerLine position</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm">Contact your sponsor</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm">Complete enrollment</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};