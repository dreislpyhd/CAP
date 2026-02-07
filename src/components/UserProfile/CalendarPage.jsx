import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isUpcomingEventsCollapsed, setIsUpcomingEventsCollapsed] = useState(false);

  // Fetch events from the same API as TDS.jsx
  const fetchEvents = async () => {
    try {
      console.log('CalendarPage: Fetching events from API...');
      const response = await axios.get('http://localhost/gsm/backend/api/coordination/training.php');
      console.log('CalendarPage: API Response:', response.data);
      if (response.data.success) {
        setEvents(response.data.data || []);
        console.log('CalendarPage: Events loaded:', response.data.data?.length || 0);
      } else {
        console.error('CalendarPage: API returned error:', response.data.message);
      }
    } catch (error) {
      console.error('CalendarPage: Error fetching events:', error);
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Set up auto-refresh every 30 seconds to sync with TDS.jsx
    const interval = setInterval(fetchEvents, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const monthNames = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const dayNames = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);

  const getDaysInMonth = useMemo(() => (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useMemo(() => (month, year) => {
    return new Date(year, month, 1).getDay();
  }, []);

  const isToday = useMemo(() => (date) => {
    const today = new Date();
    return date === today.toISOString().split('T')[0];
  }, []);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getEventsForDate = useMemo(() => {
    return (date) => events.filter(event => event.date.split('T')[0] === date);
  }, [events]);

  // Generate calendar days with memoization
  const calendar = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    const calendarArray = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarArray.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => event.date.split('T')[0] === date);
      calendarArray.push({
        day,
        date,
        events: dayEvents
      });
    }

    return calendarArray;
  }, [currentMonth, currentYear, events]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsEventModalOpen(true);
  };

  const getUpcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [events]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Calendar className="h-6 w-6 mr-2 text-blue-600" />
        Calendar & Schedule
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold">
                {monthNames[currentMonth]} {currentYear}
              </h2>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-sm text-gray-600">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendar.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 ${
                    day ? '' : 'bg-gray-50'
                  } ${day && isToday(day.date) ? 'bg-blue-100' : ''}`}
                  onClick={() => day && handleDateClick(day.date)}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium mb-1">{day.day}</div>
                      {day.events.length > 0 && (
                        <div className="space-y-1">
                          {day.events.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded bg-blue-500 text-white truncate"
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{day.events.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div 
              className="flex justify-between items-center mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              onClick={() => setIsUpcomingEventsCollapsed(!isUpcomingEventsCollapsed)}
            >
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              <div className="flex items-center gap-2">
                {isUpcomingEventsCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
            
            {!isUpcomingEventsCollapsed && (
              <div className="space-y-3">
                {getUpcomingEvents.length > 0 ? (
                  getUpcomingEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.time || 'All day'}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.participants && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Users className="h-3 w-3 mr-1" />
                            {event.participants} participants
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedEvent ? 'Event Details' : `Events for ${new Date(selectedDate).toLocaleDateString()}`}
              </h3>
              <button
                onClick={() => {
                  setIsEventModalOpen(false);
                  setSelectedEvent(null);
                  setSelectedDate(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {selectedEvent ? (
                // Single event details
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-lg mb-3">{selectedEvent.title}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{selectedEvent.time} ({selectedEvent.duration})</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    <div className="mt-3">
                      <div className="font-medium mb-1">Description:</div>
                      <div className="text-gray-600">{selectedEvent.description}</div>
                    </div>
                  </div>
                </div>
              ) : selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                // Multiple events for selected date
                getEventsForDate(selectedDate).map(event => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      <div>{event.time} ({event.duration})</div>
                      {event.location && <div>{event.location}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No events scheduled for this date</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
