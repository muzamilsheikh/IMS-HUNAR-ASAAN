import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/layout/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MessageSquare, Shield, Users, Circle, User, Mail } from 'lucide-react';

const Chat = () => {
    const { user, api, socket } = useApp();
    const [chatGroups, setChatGroups] = useState([]);
    const [directMessagePartners, setDirectMessagePartners] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'direct'
    const messagesEndRef = useRef(null);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    
    // User Directory states
    const [showUserDirectoryModal, setShowUserDirectoryModal] = useState(false);
    const [directorySearchQuery, setDirectorySearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Reference to selectedGroup to prevent stale closures in socket listener
    const selectedGroupRef = useRef(null);
    useEffect(() => {
        selectedGroupRef.current = selectedGroup;
    }, [selectedGroup]);

    // Debounce search query for Directory Modal
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(directorySearchQuery);
        }, 250);
        return () => clearTimeout(timer);
    }, [directorySearchQuery]);

    // Fetch chat groups and direct message partners
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get user's chat groups
                const groupsResponse = await api.getChatGroups();
                setChatGroups(groupsResponse);

                // Get direct message partners
                const partnersResponse = await api.getDirectMessagePartners();
                setDirectMessagePartners(partnersResponse);
                
                // Get all users if user is admin
                if (user?.role === 'Admin' || user?.role === 'Staff') {
                    try {
                        // Get all users (staff/admin) 
                        const usersResponse = await api.getUsers();
                        const extractedUsers = usersResponse.users || [];
                        
                        setAllUsers(extractedUsers);
                        setAvailableUsers(extractedUsers);
                    } catch (err) {
                        console.error('Error fetching users:', err);
                        // Fallback to empty arrays
                        setAllUsers([]);
                        setAvailableUsers([]);
                    }
                } else if (user?.role === 'Student') {
                    // For students, only show admin/staff for direct messaging
                    try {
                        const usersResponse = await api.getUsers();
                        const extractedUsers = usersResponse.users || [];
                        const adminStaffUsers = extractedUsers.filter(u => u.role === 'Admin' || u.role === 'Staff');
                        setAllUsers(adminStaffUsers);
                        setAvailableUsers(adminStaffUsers);
                    } catch (err) {
                        console.error('Error fetching admin/staff users:', err);
                        // Fallback to empty arrays
                        setAllUsers([]);
                        setAvailableUsers([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching chat data:', error);
                // Handle error gracefully without breaking UI
                setChatGroups([]);
                setDirectMessagePartners([]);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, api]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Connect to socket
    useEffect(() => {
        if (socket) {
            socket.on('connect', () => {
                setSocketConnected(true);
                console.log('Socket connected successfully in Chat');
                // Join user's room
                if (user?.id) {
                    socket.emit('join-room', `user_${user.id}`);
                }
            });

            socket.on('disconnect', (reason) => {
                console.log('Socket disconnected in Chat:', reason);
                setSocketConnected(false);
            });

            socket.on('receive-message', (data) => {
                const currentGroup = selectedGroupRef.current;
                if (currentGroup && data.groupId === currentGroup.id) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
                
                // Refresh list to show new message / update order
                const refreshLists = async () => {
                    try {
                        const groupsResponse = await api.getChatGroups();
                        setChatGroups(groupsResponse);
                        const partnersResponse = await api.getDirectMessagePartners();
                        setDirectMessagePartners(partnersResponse);
                    } catch (error) {
                        console.error('Error refreshing chat lists on receive-message:', error);
                    }
                };
                refreshLists();
            });

            return () => {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('receive-message');
            };
        }
    }, [socket, user]); // Include user to ensure proper setup
    
    // Handle joining/leaving rooms when selectedGroup changes
    useEffect(() => {
        if (socket && selectedGroup && !selectedGroup.isTemporary) {
            // Join the selected group room
            socket.emit('join-room', `group_${selectedGroup.id}`);
        }
        
        // Cleanup: leave room when selectedGroup changes
        return () => {
            if (socket && selectedGroup && !selectedGroup.isTemporary) {
                socket.emit('leave-room', `group_${selectedGroup.id}`);
            }
        };
    }, [selectedGroup, socket]);

    // Load messages for selected group
    useEffect(() => {
        const loadMessages = async () => {
            if (selectedGroup) {
                if (selectedGroup.isTemporary) {
                    setMessages([]);
                    return;
                }
                try {
                    const response = await api.getGroupMessages(selectedGroup.id);
                    setMessages(response);
                } catch (error) {
                    console.error('Error loading messages:', error);
                    // Set empty messages to prevent UI crashes
                    setMessages([]);
                }
            }
        };

        loadMessages();
    }, [selectedGroup, api]);

    const getDMName = (group) => {
        if (!group) return '';
        if (group.type !== 'direct') return group.groupName;
        if (group.isTemporary) {
            return group.recipientName || 'Direct Message';
        }
        
        // groupName is "DM_id1_id2"
        const parts = group.groupName.split('_');
        if (parts.length === 3 && parts[0] === 'DM') {
            const id1 = parseInt(parts[1], 10);
            const id2 = parseInt(parts[2], 10);
            const otherId = id1 === user?.id ? id2 : id1;
            const otherUser = allUsers.find(u => u.id === otherId);
            if (otherUser) return otherUser.name;
            const otherPartner = directMessagePartners.find(p => p.id === otherId);
            if (otherPartner) return otherPartner.name;
            return `User #${otherId}`;
        }
        return group.groupName;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        try {
            let activeGroup = selectedGroup;
            if (selectedGroup?.isTemporary) {
                // Synchronously create the direct message thread
                const response = await api.createDirectMessage(selectedGroup.recipientId);
                activeGroup = response;
                
                // Join the newly created group's room synchronously
                socket.emit('join-room', `group_${response.id}`);
                
                // Sync states
                setChatGroups(prev => [response, ...prev]);
                setSelectedGroup(response);
            }

            // Send message via socket
            socket.emit('send-message', {
                groupId: activeGroup?.id,
                message: newMessage,
                senderId: user?.id,
                senderName: user?.name,
                senderRole: user?.role
            });

            // Clear message input
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleStartDirectMessage = async (partnerId) => {
        try {
            const response = await api.createDirectMessage(partnerId);
            setSelectedGroup(response);
            setActiveTab('groups'); // Switch to groups tab to show the DM
        } catch (error) {
            console.error('Error starting direct message:', error);
        }
    };

    return (
        <>
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        <button
                            className={`px-6 py-4 font-medium text-sm ${activeTab === 'groups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            Groups
                        </button>
                        {(user?.role === 'Admin' || user?.role === 'Staff') && (
                            <button
                                className={`px-6 py-4 font-medium text-sm ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('users')}
                            >
                                Users
                            </button>
                        )}
                        <button
                            className={`px-6 py-4 font-medium text-sm ${activeTab === 'direct' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('direct')}
                        >
                            Direct Messages
                        </button>
                    </nav>
                </div>

                <div className="flex h-[calc(100vh-200px)]">
                    {/* Sidebar - Chat Groups or DM Partners */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-800">
                                    {activeTab === 'groups' ? 'Chat Groups' : 
                                     activeTab === 'users' ? 'Users' : 'Direct Messages'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {/* Create Group Button */}
                                    {activeTab === 'groups' && (user?.role === 'Admin' || user?.role === 'Staff') && (
                                        <button
                                            onClick={() => setShowCreateGroupModal(true)}
                                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                            title="Create Group"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </button>
                                    )}
                                    
                                    {/* Prominent Plus (+) button for User Directory */}
                                    {(user?.role === 'Admin' || user?.role === 'Staff') && (
                                        <button
                                            onClick={() => setShowUserDirectoryModal(true)}
                                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer shadow-sm flex items-center justify-center"
                                            title="Open User Directory"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Search bar for users tab */}
                            {activeTab === 'users' && (
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'groups' ? (
                                chatGroups.map(group => (
                                    <div
                                        key={group.id}
                                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                            selectedGroup?.id === group.id ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        <div className="font-medium">{getDMName(group)}</div>
                                        <div className="text-sm text-gray-500">
                                            {group.type === 'batch' && group.Batch ? `Batch: ${group.Batch.name}` : 'Direct Message'}
                                        </div>
                                    </div>
                                ))
                            ) : activeTab === 'users' ? (
                                // Filter users based on search term
                                availableUsers
                                    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(user => (
                                        <div
                                            key={user.id}
                                            className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleStartDirectMessage(user.id)}
                                        >
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-gray-500">Role: {user.role}</div>
                                        </div>
                                    ))
                            ) : (
                                directMessagePartners.map(partner => (
                                    <div
                                        key={partner.id}
                                        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleStartDirectMessage(partner.id)}
                                    >
                                        <div className="font-medium">{partner.name}</div>
                                        <div className="text-sm text-gray-500">Role: {partner.role}</div>
                                    </div>
                                ))
                            )}
                            
                            {activeTab === 'groups' && chatGroups.length === 0 && (
                                <div className="p-4 text-center text-gray-500">
                                    No chat groups available
                                </div>
                            )}
                            
                            {activeTab === 'users' && availableUsers.length === 0 && (
                                <div className="p-4 text-center text-gray-500">
                                    No users found
                                </div>
                            )}
                            
                            {activeTab === 'direct' && directMessagePartners.length === 0 && (
                                <div className="p-4 text-center text-gray-500">
                                    No direct message partners available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedGroup ? (
                            <>
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <h4 className="font-semibold">{getDMName(selectedGroup)}</h4>
                                    <p className="text-sm text-gray-500">
                                        {selectedGroup.type === 'batch' && selectedGroup.Batch ? 
                                            `Batch: ${selectedGroup.Batch.name}` : 'Direct Message'}
                                    </p>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">
                                            <p>No messages yet in this chat.</p>
                                            <p className="text-sm mt-2">Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => (
                                            <div key={index} className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                                                msg.senderId === user?.id ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                                            }`}>
                                                <div className="font-medium text-sm">
                                                    {msg.sender?.name || msg.senderName || 'Unknown'} <span className="text-xs text-gray-500">({msg.sender?.role || msg.senderRole || 'User'})</span>
                                                </div>
                                                <div className="text-gray-800">{msg.message}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(msg.createdAt || msg.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                <div className="p-4 border-t border-gray-200">
                                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium">Select a chat</h3>
                                    <p className="mt-1 text-sm">Choose a group or direct message to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Socket connection status */}
                <div className="p-4 border-t border-gray-200 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        <span className={`mr-1.5 h-2 w-2 rounded-full ${
                            socketConnected ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {socketConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Create Group Modal */}
        <AnimatePresence>
            {showCreateGroupModal && (
                <Modal
                    isOpen={showCreateGroupModal}
                    onClose={() => {
                        setShowCreateGroupModal(false);
                        setNewGroupName('');
                    }}
                    title="Create New Group"
                    maxWidth="max-w-md"
                >
                    <input
                        type="text"
                        placeholder="Group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                setShowCreateGroupModal(false);
                                setNewGroupName('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer text-slate-500 font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                if (newGroupName.trim()) {
                                    try {
                                        // Create new chat group
                                        const response = await api.createChatGroup({
                                            groupName: newGroupName,
                                            type: 'batch'
                                        });
                                        
                                        // Refresh the chat groups
                                        const groupsResponse = await api.getChatGroups();
                                        setChatGroups(groupsResponse);
                                        
                                        setShowCreateGroupModal(false);
                                        setNewGroupName('');
                                    } catch (error) {
                                        console.error('Error creating group:', error);
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer font-bold"
                        >
                            Create
                        </button>
                    </div>
                </Modal>
            )}
        </AnimatePresence>

        {/* User Directory Modal */}
        <AnimatePresence>
            {showUserDirectoryModal && (
                <Modal
                    isOpen={showUserDirectoryModal}
                    onClose={() => {
                        setShowUserDirectoryModal(false);
                        setDirectorySearchQuery('');
                    }}
                    title="User Directory"
                    maxWidth="max-w-2xl"
                >
                    {/* Sticky Search bar */}
                    <div className="sticky top-0 bg-white z-10 pb-4 mb-4 border-b border-slate-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by Name, Role, or Department..."
                                value={directorySearchQuery}
                                onChange={(e) => setDirectorySearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800"
                            />
                            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Directory list of user cards */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {allUsers.filter(u => {
                            const q = debouncedSearchQuery.toLowerCase();
                            // Exclude current user from the list
                            if (u.id === user?.id || (u.isStudent && `student_${u.id}` === `student_${user?.id}`)) {
                                return false;
                            }
                            const nameMatch = u.name?.toLowerCase().includes(q);
                            const roleMatch = u.role?.toLowerCase().includes(q);
                            const emailMatch = u.email?.toLowerCase().includes(q);
                            return nameMatch || roleMatch || emailMatch;
                        }).length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <User className="w-12 h-12 mx-auto text-slate-300 mb-2 animate-bounce" />
                                <p className="text-sm font-medium">No matching users or staff found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {allUsers
                                    .filter(u => {
                                        const q = debouncedSearchQuery.toLowerCase();
                                        if (u.id === user?.id || (u.isStudent && `student_${u.id}` === `student_${user?.id}`)) {
                                            return false;
                                        }
                                        const nameMatch = u.name?.toLowerCase().includes(q);
                                        const roleMatch = u.role?.toLowerCase().includes(q);
                                        const emailMatch = u.email?.toLowerCase().includes(q);
                                        return nameMatch || roleMatch || emailMatch;
                                    })
                                    .map(userItem => {
                                        const firstLetter = userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U';
                                        
                                        // Role badge styling
                                        let badgeClass = "bg-slate-50 text-slate-700 border-slate-100";
                                        if (userItem.role === 'Admin') badgeClass = "bg-rose-50 text-rose-700 border border-rose-100";
                                        else if (userItem.role === 'Student') badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                                        else if (userItem.role === 'Staff' || userItem.role === 'Instructor') badgeClass = "bg-amber-50 text-amber-700 border border-amber-100";
                                        else if (userItem.role === 'Manager') badgeClass = "bg-purple-50 text-purple-700 border border-purple-100";

                                        return (
                                            <div
                                                key={userItem.id}
                                                onClick={() => {
                                                    // 1. Search for existing DM thread
                                                    const existing = chatGroups.find(g => {
                                                        if (g.type !== 'direct') return false;
                                                        const parts = g.groupName.split('_');
                                                        if (parts.length === 3 && parts[0] === 'DM') {
                                                            const id1 = parseInt(parts[1], 10);
                                                            const id2 = parseInt(parts[2], 10);
                                                            const otherId = id1 === user?.id ? id2 : id1;
                                                            
                                                            if (userItem.isStudent) {
                                                                // Find user record in allUsers matching student email
                                                                const correspondingUser = allUsers.find(u => !u.isStudent && u.email === userItem.email);
                                                                if (correspondingUser && otherId === correspondingUser.id) {
                                                                    return true;
                                                                }
                                                            } else {
                                                                if (otherId === userItem.id) return true;
                                                            }
                                                        }
                                                        return false;
                                                    });

                                                    if (existing) {
                                                        // Thread exists: select and load it
                                                        setSelectedGroup(existing);
                                                        setActiveTab('groups');
                                                    } else {
                                                        // Thread does not exist: initialize temporary payload
                                                        let userRecord = allUsers.find(u => !u.isStudent && u.email === userItem.email);
                                                        let finalUserTableId = userRecord ? userRecord.id : null;
                                                        
                                                        const dmGroupName = finalUserTableId 
                                                            ? `DM_${Math.min(user.id, finalUserTableId)}_${Math.max(user.id, finalUserTableId)}`
                                                            : `DM_temp_${user.id}_${userItem.id}`;

                                                        const tempGroup = {
                                                            id: null,
                                                            groupName: dmGroupName,
                                                            type: 'direct',
                                                            isTemporary: true,
                                                            recipientId: userItem.id,
                                                            recipientName: userItem.name,
                                                            recipientRole: userItem.role
                                                        };
                                                        setSelectedGroup(tempGroup);
                                                        setActiveTab('groups');
                                                    }
                                                    
                                                    setShowUserDirectoryModal(false);
                                                    setDirectorySearchQuery('');
                                                }}
                                                className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-blue-200 rounded-2xl hover:bg-slate-50/50 cursor-pointer transition duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                                                        {firstLetter}
                                                    </div>
                                                    
                                                    {/* Details */}
                                                    <div>
                                                        <div className="font-semibold text-slate-800 text-sm">{userItem.name}</div>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                                                                {userItem.role}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]" title={userItem.email}>
                                                                {userItem.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Indicator */}
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                    <span className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm ${userItem.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {userItem.status === 'Active' ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </AnimatePresence>
        </>
    );
};

export default Chat;