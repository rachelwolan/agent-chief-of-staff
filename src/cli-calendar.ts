#!/usr/bin/env node

import { Command } from 'commander';
import { GoogleCalendarService } from './services/google-calendar.js';

const program = new Command();

program
  .name('calendar')
  .description('Google Calendar CLI for Chief of Staff Agent')
  .version('0.1.0');

program
  .command('today')
  .description('Show today\'s calendar events')
  .action(async () => {
    try {
      const calendarService = new GoogleCalendarService();
      const events = await calendarService.getTodayEvents();

      console.log(`\n📅 Today's Events (${events.length}):\n`);

      if (events.length === 0) {
        console.log('No events scheduled for today.');
        return;
      }

      events.forEach(event => {
        const startTime = new Date(event.start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        const endTime = new Date(event.end).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        console.log(`⏰ ${startTime} - ${endTime}`);
        console.log(`   ${event.summary}`);
        if (event.location) {
          console.log(`   📍 ${event.location}`);
        }
        if (event.attendees && event.attendees.length > 0) {
          console.log(`   👥 ${event.attendees.join(', ')}`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error fetching calendar events:', error);
      process.exit(1);
    }
  });

program
  .command('week')
  .description('Show this week\'s calendar events')
  .action(async () => {
    try {
      const calendarService = new GoogleCalendarService();
      const events = await calendarService.getWeekEvents();

      console.log(`\n📅 This Week's Events (${events.length}):\n`);

      if (events.length === 0) {
        console.log('No events scheduled for this week.');
        return;
      }

      events.forEach(event => {
        const startDate = new Date(event.start);
        const dateStr = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const startTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        const endTime = new Date(event.end).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        console.log(`📆 ${dateStr}`);
        console.log(`⏰ ${startTime} - ${endTime}`);
        console.log(`   ${event.summary}`);
        if (event.location) {
          console.log(`   📍 ${event.location}`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error fetching calendar events:', error);
      process.exit(1);
    }
  });

program
  .command('upcoming')
  .description('Show upcoming calendar events')
  .option('-n, --number <count>', 'Number of events to show', '10')
  .action(async (options) => {
    try {
      const calendarService = new GoogleCalendarService();
      const count = parseInt(options.number);
      const events = await calendarService.getUpcomingEvents(count);

      console.log(`\n📅 Upcoming Events (${events.length}):\n`);

      if (events.length === 0) {
        console.log('No upcoming events.');
        return;
      }

      events.forEach(event => {
        const startDate = new Date(event.start);
        const dateStr = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const startTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        const endTime = new Date(event.end).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        console.log(`📆 ${dateStr}`);
        console.log(`⏰ ${startTime} - ${endTime}`);
        console.log(`   ${event.summary}`);
        if (event.location) {
          console.log(`   📍 ${event.location}`);
        }
        if (event.attendees && event.attendees.length > 0) {
          console.log(`   👥 ${event.attendees.slice(0, 3).join(', ')}${event.attendees.length > 3 ? '...' : ''}`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error fetching calendar events:', error);
      process.exit(1);
    }
  });

program.parse();
