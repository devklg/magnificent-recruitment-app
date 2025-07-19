// ALEXA: Discord + Framer inspired dashboard component

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Target, Crown, MessageSquare, Activity, Settings, Plus } from 'lucide-react';

interface DashboardProps {
  user: any;
  teams: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, teams }) => {
  const [selectedTeam, setSelectedTeam] = useState(teams[0] || null);
  const [activities, setActivities] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingStyle = {
    transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
    transition: 'transform 0.2s ease-out'
  };

  return (
    <div className="min-h-screen p-6" style={{ 
      background: 'linear-gradient(180deg, #1e1f22 0%, #2b2d31 50%, #1e1f22 100%)',
      color: '#ffffff'
    }}>
      {/* Floating Background Orbs */}
      <div className="fixed top-[20%] left-[10%] w-[300px] h-[300px] rounded-full opacity-20 animate-pulse"
           style={{
             background: 'radial-gradient(circle, rgba(88, 101, 242, 0.3) 0%, transparent 70%)',
             filter: 'blur(40px)',
             ...floatingStyle
           }}></div>
      
      <div className="fixed bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full opacity-20 animate-pulse"
           style={{
             background: 'radial-gradient(circle, rgba(114, 137, 218, 0.3) 0%, transparent 70%)',
             filter: 'blur(30px)',
             transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
             transition: 'transform 0.2s ease-out'
           }}></div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #5865F2 50%, #7289DA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                Welcome back, {user.username}!
              </h1>
              <p className="text-[#b9bbbe] text-lg">
                Your recruitment empire awaits. Let's build something magnificent.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg"
                   style={{
                     background: 'rgba(88, 101, 242, 0.1)',
                     border: '1px solid rgba(88, 101, 242, 0.3)'
                   }}>
                <div className="w-3 h-3 rounded-full bg-[#4CAF50] animate-pulse"></div>
                <span className="text-sm font-medium">Level {user.stats.level}</span>
              </div>
              
              <button className="p-3 rounded-lg transition-all hover:-translate-y-1 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                        boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)'
                      }}>
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* User Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                icon: Crown,
                label: 'Level',
                value: user.stats.level,
                color: '#FFD700',
                change: '+2 this week'
              },
              {
                icon: Target,
                label: 'Recruits',
                value: user.stats.recruits,
                color: '#5865F2',
                change: `+${user.stats.recruits > 10 ? Math.floor(user.stats.recruits * 0.2) : 3} this week`
              },
              {
                icon: TrendingUp,
                label: 'Points',
                value: user.stats.points.toLocaleString(),
                color: '#57F287',
                change: '+1,250 this week'
              },
              {
                icon: Users,
                label: 'Teams',
                value: teams.length,
                color: '#EB459E',
                change: teams.length > 0 ? 'Active member' : 'Join a team'
              }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="p-6 rounded-xl transition-all hover:-translate-y-2 hover:scale-105 cursor-pointer"
                     style={{
                       background: 'rgba(43, 45, 49, 0.8)',
                       border: `1px solid ${stat.color}30`,
                       backdropFilter: 'blur(20px)',
                       boxShadow: `0 8px 32px ${stat.color}20`
                     }}>
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent className="h-8 w-8" style={{ color: stat.color }} />
                    <span className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: `${stat.color}20`,
                            color: stat.color
                          }}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-[#b9bbbe] text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Team Selection & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Selector */}
            <div className="p-6 rounded-xl"
                 style={{
                   background: 'rgba(43, 45, 49, 0.8)',
                   border: '1px solid rgba(88, 101, 242, 0.3)',
                   backdropFilter: 'blur(20px)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Teams</h2>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'rgba(88, 101, 242, 0.1)',
                          border: '1px solid #5865F2',
                          color: '#5865F2'
                        }}>
                  <Plus className="h-4 w-4" />
                  Join Team
                </button>
              </div>
              
              {teams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teams.map((team, index) => (
                    <div key={index} 
                         className={`p-4 rounded-lg cursor-pointer transition-all hover:-translate-y-1 ${
                           selectedTeam?.id === team.id ? 'scale-105' : ''
                         }`}
                         style={{
                           background: selectedTeam?.id === team.id 
                             ? 'rgba(88, 101, 242, 0.2)' 
                             : 'rgba(114, 137, 218, 0.1)',
                           border: selectedTeam?.id === team.id 
                             ? '1px solid #5865F2' 
                             : '1px solid rgba(114, 137, 218, 0.3)'
                         }}
                         onClick={() => setSelectedTeam(team)}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center font-bold">
                          {team.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <h3 className="font-semibold">{team.name || 'Team Name'}</h3>
                          <p className="text-[#b9bbbe] text-sm">{team.memberCount || 1} members</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-[#b9bbbe]" />
                  <p className="text-[#b9bbbe] mb-4">You haven't joined any teams yet</p>
                  <button className="px-6 py-2 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                          style={{
                            background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                            color: 'white'
                          }}>
                    Discover Teams
                  </button>
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="p-6 rounded-xl"
                 style={{
                   background: 'rgba(43, 45, 49, 0.8)',
                   border: '1px solid rgba(88, 101, 242, 0.3)',
                   backdropFilter: 'blur(20px)'
                 }}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-[#5865F2]" />
                <h2 className="text-xl font-bold">Recent Activity</h2>
              </div>
              
              <div className="space-y-3">
                {[
                  {
                    type: 'recruit',
                    message: 'You recruited a new team member',
                    time: '2 hours ago',
                    points: '+100 XP'
                  },
                  {
                    type: 'level_up',
                    message: 'Congratulations! You reached level ' + user.stats.level,
                    time: '1 day ago',
                    points: '+500 XP'
                  },
                  {
                    type: 'achievement',
                    message: 'Achievement unlocked: "First Recruit"',
                    time: '2 days ago',
                    points: '+250 XP'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-[rgba(88,101,242,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-[#4CAF50] mt-2 animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#b9bbbe]">{activity.time}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(87,242,135,0.2)] text-[#57F287]">
                          {activity.points}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Team Info & Online Members */}
          <div className="space-y-6">
            {/* Selected Team Info */}
            {selectedTeam && (
              <div className="p-6 rounded-xl"
                   style={{
                     background: 'rgba(43, 45, 49, 0.8)',
                     border: '1px solid rgba(88, 101, 242, 0.3)',
                     backdropFilter: 'blur(20px)'
                   }}>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                    {selectedTeam.name?.charAt(0) || 'T'}
                  </div>
                  <h3 className="text-lg font-bold">{selectedTeam.name || 'Team Name'}</h3>
                  <p className="text-[#b9bbbe] text-sm">{selectedTeam.description || 'Building recruitment excellence together'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(88, 101, 242, 0.1)' }}>
                    <div className="text-2xl font-bold text-[#5865F2]">{selectedTeam.memberCount || 1}</div>
                    <div className="text-xs text-[#b9bbbe]">Members</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(87, 242, 135, 0.1)' }}>
                    <div className="text-2xl font-bold text-[#57F287]">{selectedTeam.level || 1}</div>
                    <div className="text-xs text-[#b9bbbe]">Team Level</div>
                  </div>
                </div>
                
                <button className="w-full py-2 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                          color: 'white'
                        }}>
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Open Team Chat
                </button>
              </div>
            )}

            {/* Online Members */}
            <div className="p-6 rounded-xl"
                 style={{
                   background: 'rgba(43, 45, 49, 0.8)',
                   border: '1px solid rgba(88, 101, 242, 0.3)',
                   backdropFilter: 'blur(20px)'
                 }}>
              <h3 className="text-lg font-bold mb-4">Online Now</h3>
              
              <div className="space-y-3">
                {[
                  { name: 'Alex#1234', status: 'online', activity: 'Recruiting' },
                  { name: 'Sarah#5678', status: 'idle', activity: 'Away' },
                  { name: 'Mike#9012', status: 'dnd', activity: 'Do Not Disturb' }
                ].map((member, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(88,101,242,0.1)] transition-all">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center text-sm font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
                        member.status === 'online' ? 'bg-[#4CAF50]' :
                        member.status === 'idle' ? 'bg-[#FEE75C]' :
                        'bg-[#F23F42]'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-xs text-[#b9bbbe]">{member.activity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;