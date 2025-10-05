import { meetingPrepAgent, MeetingPrepInput } from '../agents/meeting-prep.js';

export interface Task {
  id: string;
  title: string;
  description?: string;
  agent?: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
  output?: string;
  error?: string;
  progress?: number;
  logs?: string[];
  input?: any; // Agent-specific input
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private listeners: Set<(tasks: Task[]) => void> = new Set();

  createTask(params: {
    title: string;
    description?: string;
    agent?: string;
    priority?: Task['priority'];
    input?: any;
  }): Task {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: params.title,
      description: params.description,
      agent: params.agent,
      status: 'pending',
      priority: params.priority || 'medium',
      createdAt: new Date(),
      logs: [],
      input: params.input
    };

    this.tasks.set(task.id, task);
    this.notifyListeners();
    return task;
  }

  assignTask(taskId: string, agent: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'assigned';
      task.assignedTo = agent;
      task.logs?.push(`Task assigned to ${agent}`);
      this.notifyListeners();
    }
  }

  updateTaskStatus(taskId: string, status: Task['status'], output?: string, error?: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;

      if (status === 'running' && !task.startedAt) {
        task.startedAt = new Date();
        task.logs?.push(`Task started at ${task.startedAt.toLocaleTimeString()}`);
      }

      if (status === 'completed' || status === 'failed') {
        task.completedAt = new Date();
        if (output) task.output = output;
        if (error) task.error = error;
        task.logs?.push(`Task ${status} at ${task.completedAt.toLocaleTimeString()}`);
      }

      this.notifyListeners();
    }
  }

  updateTaskProgress(taskId: string, progress: number, log?: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
      if (log) {
        task.logs?.push(log);
      }
      this.notifyListeners();
    }
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  deleteTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.notifyListeners();
  }

  clearCompletedTasks(): void {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
      }
    }
    this.notifyListeners();
  }

  // Subscribe to task updates
  subscribe(listener: (tasks: Task[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const tasks = this.getAllTasks();
    this.listeners.forEach(listener => listener(tasks));
  }

  // Execute task with real agents
  async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.agent) return;

    this.updateTaskStatus(taskId, 'running');

    // Use real agent for meeting-prep
    if (task.agent === 'meeting-prep' && task.input) {
      try {
        this.updateTaskProgress(taskId, 20, 'Fetching calendar details...');
        const result = await meetingPrepAgent.prepareMeeting(task.input as MeetingPrepInput);

        this.updateTaskProgress(taskId, 100, 'Meeting preparation complete');

        const output = `# Meeting Preparation Complete

${result.materials.onePageBrief}

---

## Detailed Notes

${result.materials.detailedNotes}`;

        this.updateTaskStatus(taskId, 'completed', output);
        return;
      } catch (error) {
        this.updateTaskStatus(taskId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
        return;
      }
    }

    // Continue with simulated execution for other agents
    this.simulateAgentExecution(taskId);
  }

  // Simulate agent execution (for demo)
  private async simulateAgentExecution(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.agent) return;

    // Simulate progress updates
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.updateTaskProgress(taskId, i, `Processing... ${i}%`);
    }

    // Simulate output based on agent type
    const outputs: Record<string, string> = {
      'meeting-prep': `# Meeting Preparation Complete

## Participants
- John Smith (Product Manager, Acme Corp)
- Jane Doe (CTO, Tech Solutions)

## Key Discussion Points
1. Q4 Product Roadmap Review
2. AI Integration Strategy
3. Budget Allocation for 2025

## Recommended Talking Points
- Emphasize our competitive advantages in AI
- Discuss partnership opportunities
- Present case studies from similar implementations

## Action Items
- [ ] Prepare demo environment
- [ ] Send pre-read materials
- [ ] Schedule follow-up meeting`,

      'video-transcriber': `# Transcription Complete

**File**: presentation.mp4
**Duration**: 15:32
**Language**: English

## Transcript

[00:00] Welcome to today's presentation on AI transformation...
[00:15] We'll cover three main topics today...
[00:30] First, let's discuss the current landscape...

## Key Points
- AI adoption is accelerating across industries
- Focus on practical implementation over theory
- ROI typically seen within 6 months`,

      'slack-summarizer': `# Slack Summary

**Channel**: #product-team
**Period**: Last 24 hours
**Messages**: 47

## Key Decisions
- Launch date moved to Dec 15th
- Feature X approved for development
- Budget increased by 20% for Q1

## Action Items
- @john: Update roadmap by EOD
- @jane: Schedule design review
- @team: Review PRD and provide feedback`,

      'podcast-prep-researcher': `# Podcast Research Complete

**Show**: The Product Leadership Podcast
**Host**: Sarah Chen
**Audience**: 25,000+ product managers

## Host Background
- Former VP Product at Google
- Author of "Product-Led Growth"
- Known for tough technical questions

## Recommended Talking Points
1. Your AEO methodology
2. Dropbox transformation story
3. AI-native vs AI-enabled products

## Potential Questions
- "How do you measure AI ROI?"
- "What's your take on AGI?"
- "How do you build AI-first culture?"`
    };

    const output = outputs[task.agent] || 'Task completed successfully';

    // Randomly succeed or fail for demo (90% success rate)
    if (Math.random() > 0.1) {
      this.updateTaskStatus(taskId, 'completed', output);
    } else {
      this.updateTaskStatus(taskId, 'failed', undefined, 'Simulated error for demo purposes');
    }
  }
}

// Global instance
export const taskManager = new TaskManager();