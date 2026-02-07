import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot, Mic, MicOff, Phone, AlertTriangle, Activity, Clock } from 'lucide-react';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! I\'m your emergency assistance chatbot. How can I help you today?', sender: 'bot', timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [botStatus, setBotStatus] = useState('online');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapModalUrl, setMapModalUrl] = useState('');

  // Chatbot communication function
  const communicateWithChatbot = async (userMessage) => {
    try {
      setIsLoading(true);
      
      // For now, use mock responses since backend API is not available
      // Uncomment below when backend is ready
      /*
      const response = await fetch('/backend/api/chatbot.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          user_id: 1, // Replace with actual user ID
          session_id: 'session_' + Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock intelligent responses based on keywords
      const message = userMessage.toLowerCase();
      
      // Removed "Safest Route" logic per request
      
      if (message.includes('evacuation area') || message.includes('evacuation center') || message.includes('evacuation centers')) {
        return {
          text:
            'EVACUATION CENTERS – SOUTH\n\n' +
            'BRGY. 4\n• Daycare Center\n\n' +
            'BRGY. 12\n• Shell House\n\n' +
            'BRGY. 17 & 19\n• Caloocan Central ES\n• Covered Court\n\n' +
            'BRGY. 28\n• Brgy. Hall\n\n' +
            'BRGY. 29\n• Brgy. Hall\n\n' +
            'BRGY. 33\n• Brgy. Hall\n\n' +
            'BRGY. 34\n• Brgy. Hall\n\n' +
            'BRGY. 35\n• Bulwagan\n\n' +
            'BRGY. 36\n• Bo Obrero ES\n• Brgy. Hall, 3rd Floor\n\n' +
            'BRGY. 56\n• Brgy. Hall, 3rd Floor\n\n' +
            'BRGY. 118\n• Brgy. Hall\n\n' +
            'BRGY. 119\n• Bagong Silangan ES\n\n' +
            'BRGY. 120\n• Daycare Center\n\n' +
            'BRGY. 160\n• Multi-Purpose Hall\n• Headquarters\n\n' +
            'BRGY. 163\n• Lucas Cuadra\n\n' +
            'EVACUATION CENTERS – NORTH\n\n' +
            'BRGY. 164\n• Brgy. 164 Evacuation Center\n• Talipapa HS\n\n' +
            'BRGY. 165\n• Gremvile Chapel\n\n' +
            'BRGY. 166\n• Covered Court / CDC\n• Tamara Lane\n\n' +
            'BRGY. 167\n• Llano ES\n\n' +
            'BRGY. 168\n• Maranao CDC\n\n' +
            'BRGY. 169\n• Brgy. Session Hall\n\n' +
            'BRGY. 170\n• Ground Floor & CDC\n\n' +
            'BRGY. 172\n• Brgy. 172 Gym\n\n' +
            'BRGY. 175\n• Libis Court\n\n' +
            'BRGY. 176\n• Pag-Asa ES\n• Kalayaan ES\n• Sunbeam CDC\n• Church PH. 9\n• Cayetano Bagong Silang\n\n' +
            'BRGY. 177\n• Brgy. Hall / Kalupawa Chapel\n\n' +
            'BRGY. 178\n• CADES\n\n' +
            'BRGY. 179\n• BADAC Building\n\n' +
            'BRGY. 180\n• Brgy. Hall\n\n' +
            'BRGY. 181\n• Pangarap Court\n\n' +
            'BRGY. 183\n• Court\n\n' +
            'BRGY. 184\n• Brgy. Hall\n\n' +
            'BRGY. 185\n• Manuel L. Quezon ES\n\n' +
            'BRGY. 186\n• T.E. Court\n\n' +
            'BRGY. 187\n• San Roque Brgy. Hall\n\n' +
            'BRGY. 188\n• Brgy. Hall, 3rd Floor\n• PH. 12 Covered Court',
          type: 'evacuation_centers',
          quick_replies: ['Show South Only', 'Show North Only', 'Open Map']
        };
      }
      
      if (message.includes('evacuation') || message.includes('guideline') || message.includes('safety') || message.includes('safety guideline')) {
        return {
          text: '🚨 **EVACUATION SAFETY GUIDELINES**\n\n**IMMEDIATE ACTIONS:**\n✅ Stay calm but move quickly - don\'t run or panic\n✅ Follow marked evacuation routes and emergency personnel\n✅ Help others only if it doesn\'t endanger yourself\n✅ Bring your emergency kit if readily accessible\n\n**DURING EVACUATION:**\n🔹 Wear sturdy shoes and protective clothing\n🔹 Move away from danger zones (flood areas, damaged buildings)\n🔹 Use stairs instead of elevators\n🔹 Keep family together and hold hands with children\n🔹 Follow traffic rules - don\'t block emergency vehicles\n\n**AT SHELTER:**\n🏠 Check in with shelter staff immediately\n🏠 Keep your emergency kit accessible\n🏠 Follow shelter rules and instructions\n🏠 Register your location with family\n\n**EMERGENCY CONTACTS:**\n📞 911 - Life-threatening emergencies\n📞 311 - Non-emergency assistance\n📞 Red Cross: 1-800-RED-CROSS\n\nWhat specific aspect do you need more details about?',
          type: 'evacuation',
          quick_replies: ['Emergency Kit Checklist', 'Family Meeting Points', 'Special Needs Assistance']
        };
      }
      
      if (message.includes('first aid') || message.includes('first aid kit') || message.includes('first aid kits') || message.includes('emergency kit') || message.includes('go bag')) {
        return {
          text:
            '🧰 FIRST AID KIT CHECKLIST\n\n' +
            'Basic Supplies:\n' +
            '• Adhesive bandages (various sizes)\n' +
            '• Sterile gauze pads & rolls\n' +
            '• Adhesive tape\n' +
            '• Antiseptic wipes / solution\n' +
            '• Antibiotic ointment\n' +
            '• Burn ointment / aloe gel\n' +
            '• Hydrocortisone cream\n' +
            '• Tweezers, scissors, safety pins\n' +
            '• Disposable gloves (nitrile)\n' +
            '• Face masks\n' +
            '• Pain relievers (paracetamol/ibuprofen)\n' +
            '• Oral rehydration salts\n' +
            '• Thermometer\n' +
            '• CPR face shield\n' +
            '• Emergency blanket\n\n' +
            'Personal & Family Items:\n' +
            '• Prescription medicines (7 days)\n' +
            '• Personal medical info & copies of IDs\n' +
            '• Glasses/contacts supplies\n' +
            '• Infant/elderly/pet-specific needs\n\n' +
            'Disaster Kit Extras:\n' +
            '• Flashlight & batteries\n' +
            '• Whistle\n' +
            '• Clean water and non-perishable food\n' +
            '• Multi-tool & waterproof matches\n\n' +
            'Tip: Store kits in a waterproof bag. Check and replace expired items every 6 months.',
          type: 'first_aid',
          quick_replies: ['Children Needs', 'Elderly Needs', 'Pets Needs']
        };
      }
      
      if (
        message.includes('emergency call') ||
        message.includes('hotline') ||
        message.includes('hotlines') ||
        message.includes('emergency hotlines') ||
        message.includes('text emergency hotlines') ||
        message.includes('phone')
      ) {
        return {
          text:
            'Emergency Hotlines\n\n' +
            'Mobile Contact Numbers (Rescue & DRRMO)\n' +
            '• Rescue Hotline 1: 0916-797-6365\n' +
            '• Rescue Hotline 2: 0947-796-4372\n\n' +
            'Caloocan City DRRMO Rescue Trunkline\n' +
            '• Main Hotline: (02) 5310-7536 | Local 2287\n\n' +
            'Other Useful Local Hotlines\n' +
            '• Caloocan City North Medical Center: 5310-1463 (Emergency Room)\n' +
            '• City Hall Security / PNP Precinct: (02) 8288-8811',
          type: 'emergency_hotlines',
          quick_replies: ['Call Rescue 1', 'Call Rescue 2', 'Call Trunkline']
        };
      }
      
      // Default fallback responses
      const fallbackResponses = [
        "I understand you need help. Can you provide more details about your emergency situation?",
        "I'm here to assist you. Please stay calm and tell me what's happening.",
        "For immediate assistance, please call the emergency hotline at 911.",
        "I've noted your concern. Let me help you find the best course of action.",
        "Can you tell me your exact location so I can provide more specific guidance?",
      ];
      
      return {
        text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        type: 'general',
        quick_replies: ['Safety Guidelines', 'First Aid Kits', 'Emergency Call']
      };
      
    } catch (error) {
      console.error('Chatbot communication error:', error);
      
      // Fallback responses when API fails
      const fallbackResponses = [
        "I understand you need help. Can you provide more details about your emergency?",
        "I'm here to help. Please stay calm and let me know what's happening.",
        "For immediate assistance, please call the emergency hotline at 911.",
        "I've noted your concern. A response team will be with you shortly.",
        "Can you tell me your exact location so I can direct the appropriate help?",
      ];
      
      return {
        text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        type: 'fallback',
        quick_replies: ['Safety Guidelines', 'First Aid Kits', 'Emergency Call']
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Get bot response
    try {
      const botResponse = await communicateWithChatbot(userMessage.text);
      setIsTyping(false);
      
      const botMessage = {
        id: messages.length + 2,
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        type: botResponse.type || 'general',
        quickReplies: botResponse.quick_replies || []
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setIsTyping(false);
      console.error('Error getting bot response:', error);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickAction = (actionText) => {
    const action = actionText.toLowerCase();
    setInputValue(`I need ${action}`);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  botStatus === 'online' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Emergency Assistant</h1>
                <p className="text-xs text-blue-100 flex items-center">
                  <span className={`h-2 w-2 rounded-full mr-1 ${
                    botStatus === 'online' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></span>
                  {botStatus === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Chat messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50" style={{ maxHeight: '75vh' }}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' ? 'ml-2 bg-blue-600' : 'mr-2 bg-gradient-to-br from-indigo-500 to-blue-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div 
                    className={`rounded-2xl px-4 py-3 shadow-sm transform transition-all duration-200 hover:scale-105 ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm' 
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mr-2">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsListening(!isListening)}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-full hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          
          <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
              For emergencies, call 911
            </span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-blue-500" />
              Response time: ~1s
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick action buttons */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { text: 'Evacuation Area', icon: Activity, color: 'green' },
          { text: 'Safety Guidelines', icon: Activity, color: 'green' },
          { text: 'First Aid Kits', icon: AlertTriangle, color: 'orange' },
          { text: 'Emergency Call', icon: Phone, color: 'red' },
        ].map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action.text)}
            className={`flex items-center justify-center space-x-2 bg-white rounded-xl px-4 py-3 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-gray-100`}
          >
            <action.icon className={`h-4 w-4 text-${action.color}-500`} />
            <span className="text-sm font-medium text-gray-700">{action.text}</span>
          </button>
        ))}
      </div>
      
      {/* Map modal removed per request */}
    </div>
  );
};

export default ChatbotPage;
