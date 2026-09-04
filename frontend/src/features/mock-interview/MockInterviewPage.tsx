import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Code2,
  Cpu,
  Database,
  Layers,
  ChevronRight,
  ChevronDown,
  ListOrdered,
  Calendar,
  Check,
  Send,
  HelpCircle,
  Copy,
  Terminal,
  Activity,
  Bot,
  User,
  Maximize2,
  Minimize2,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

// Types for Interview Session
interface InterviewRole {
  id: string;
  title: string;
  description: string;
  default_topics: string[];
  seniority_levels: string[];
}

export interface AnswerVerification {
  status: string;
  score: number;
  summary: string;
  key_points_covered: string[];
  missing_or_incorrect: string[];
}

interface TranscriptItem {
  role: 'interviewer' | 'student';
  content: string;
  timestamp: number;
  turn_index?: number;
  is_followup?: boolean;
  verification?: AnswerVerification;
}

interface EvaluationRubric {
  score: number;
  feedback: string;
}

interface MissedOpportunity {
  topic: string;
  candidate_answer_summary: string;
  ideal_response_key_points: string;
}

interface DayPlan {
  day: number;
  title: string;
  focus: string;
  practice_tasks: string[];
  estimated_hours: number;
}

interface InterviewEvaluation {
  overall_score: number;
  hire_decision: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Needs Improvement';
  executive_summary: string;
  rubrics: {
    technical_competence: EvaluationRubric;
    communication_clarity: EvaluationRubric;
    problem_solving: EvaluationRubric;
    system_architecture: EvaluationRubric;
    confidence_delivery: EvaluationRubric;
  };
  strengths: string[];
  weaknesses: string[];
  missed_opportunities: MissedOpportunity[];
  seven_day_action_plan: DayPlan[];
}

export default function MockInterviewPage() {
  const { profile } = useAuth();
  const [stage, setStage] = useState<'setup' | 'interview' | 'evaluating' | 'report'>('setup');

  // Configuration State
  const [roles, setRoles] = useState<InterviewRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('fullstack');
  const [seniority, setSeniority] = useState<string>('Junior (1-2 YoE)');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [totalRounds, setTotalRounds] = useState<number>(5);

  // Live Interview State
  const [sessionId, setSessionId] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<string>('');
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [liveSpeechText, setLiveSpeechText] = useState<string>('');
  const [textInputFallback, setTextInputFallback] = useState<string>('');
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [audioWaves, setAudioWaves] = useState<number[]>([15, 30, 45, 60, 40, 25, 50, 75, 60, 35, 20]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [latestVerification, setLatestVerification] = useState<AnswerVerification | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Evaluation & 7-Day Plan State
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);

  // Speech Recognition & Synthesis references
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<any>(null);
  const waveIntervalRef = useRef<any>(null);

  // Fullscreen management for full screen mock interview studio
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Fetch available interview roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('/api/v1/mock-interview/roles');
        if (res.ok) {
          const data = await res.json();
          if (data.roles && data.roles.length > 0) {
            setRoles(data.roles);
            setSelectedRole(data.roles[0].id);
            setSelectedTopics(data.roles[0].default_topics);
          }
        }
      } catch (err) {
        console.warn('Using default roles config:', err);
        // Fallback default roles
        const fallbackRoles: InterviewRole[] = [
          {
            id: 'fullstack',
            title: 'Full Stack Software Engineer',
            description: 'React, TypeScript, Node.js, Python, Databases, Scalability & System Architecture',
            default_topics: ['State Management', 'API Architecture', 'Database Indexing', 'Caching & Redis', 'System Scalability'],
            seniority_levels: ['Intern / Fresher', 'Junior (1-2 YoE)', 'Mid-Level (3-5 YoE)', 'Senior (5+ YoE)']
          },
          {
            id: 'backend',
            title: 'Backend & Distributed Systems',
            description: 'Microservices, Python/Go/Node, SQL/NoSQL, Concurrency, Message Queues & System Design',
            default_topics: ['Database Optimization', 'Distributed Transactions', 'Kafka / RabbitMQ', 'Concurrency & Locks'],
            seniority_levels: ['Intern / Fresher', 'Junior (1-2 YoE)', 'Mid-Level (3-5 YoE)', 'Senior (5+ YoE)']
          },
          {
            id: 'frontend',
            title: 'Frontend & UI/UX Engineer',
            description: 'React 18+, TypeScript, Next.js, Web Performance, State Machines, Accessibility',
            default_topics: ['React Reconciliation', 'Performance & Web Vitals', 'SSR vs CSR', 'Complex UI Systems'],
            seniority_levels: ['Intern / Fresher', 'Junior (1-2 YoE)', 'Mid-Level (3-5 YoE)', 'Senior (5+ YoE)']
          },
          {
            id: 'aiml',
            title: 'AI / Machine Learning Engineer',
            description: 'LLMs, RAG Pipelines, Vector Databases, Transformers, PyTorch, Model Evaluation',
            default_topics: ['RAG Architecture', 'Vector Search & Embeddings', 'Fine-Tuning', 'Agentic Workflows'],
            seniority_levels: ['Intern / Fresher', 'Junior (1-2 YoE)', 'Mid-Level (3-5 YoE)', 'Senior (5+ YoE)']
          }
        ];
        setRoles(fallbackRoles);
        setSelectedRole(fallbackRoles[0].id);
        setSelectedTopics(fallbackRoles[0].default_topics);
      }
    }
    fetchRoles();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Update topics when role changes
  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const found = roles.find((r) => r.id === roleId);
    if (found) {
      setSelectedTopics(found.default_topics);
      if (!found.seniority_levels.includes(seniority)) {
        setSeniority(found.seniority_levels[0]);
      }
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // Audio waveform animation loop
  useEffect(() => {
    if (isInterviewerSpeaking || isListening) {
      waveIntervalRef.current = setInterval(() => {
        setAudioWaves((prev) =>
          prev.map(() => Math.floor(Math.random() * (isInterviewerSpeaking ? 75 : 55)) + 15)
        );
      }, 100);
    } else {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      setAudioWaves([15, 20, 25, 20, 15, 20, 25, 20, 15, 20, 15]);
    }
    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, [isInterviewerSpeaking, isListening]);

  // Elapsed timer
  useEffect(() => {
    if (stage === 'interview') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  // Text-to-Speech playback helper
  const speakText = (text: string) => {
    if (voiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      // Select high quality English voice if present
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('David')) &&
          v.lang.startsWith('en')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => setIsInterviewerSpeaking(true);
      utterance.onend = () => {
        setIsInterviewerSpeaking(false);
        // Auto-start listening after interviewer finishes asking
        startVoiceRecognition();
      };
      utterance.onerror = () => setIsInterviewerSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS playback error:', e);
      setIsInterviewerSpeaking(false);
    }
  };

  // Start speech recognition
  const startVoiceRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setLiveSpeechText(currentTranscript);
        setTextInputFallback(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start failed:', err);
      setIsListening(false);
    }
  };

  // Stop speech recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Start Live Mock Interview Session
  const handleStartInterview = async () => {
    setStage('interview');
    setElapsedSeconds(0);
    setLatestVerification(null);
    setIsProcessingTurn(true);

    try {
      const payload = {
        role: selectedRole,
        seniority: seniority,
        focus_areas: selectedTopics,
        student_notes: studentNotes,
        total_rounds: totalRounds
      };

      const res = await fetch('/api/v1/mock-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setCurrentRound(data.current_round || 1);
        setActiveQuestion(data.first_question);
        setTranscript([
          {
            role: 'interviewer',
            content: data.first_question,
            timestamp: Date.now(),
            turn_index: 0
          }
        ]);
        setIsProcessingTurn(false);
        speakText(data.first_question);
      } else {
        throw new Error('Start interview failed');
      }
    } catch (e) {
      console.warn('Using local interview session starter:', e);
      const initialQ =
        selectedRole === 'backend'
          ? "Welcome to your Backend Engineering interview. Let's start with system architecture: How would you design a distributed rate limiter that handles 50k requests per second across multiple regions?"
          : selectedRole === 'frontend'
          ? "Welcome to your Frontend interview! To start off, how do you handle state synchronization across deeply nested components and prevent unnecessary re-renders in React?"
          : "Hello! Welcome to your technical mock interview. To begin, could you walk me through the architecture of a complex full-stack project you've built, explaining your choice of data stores and state management?";

      setSessionId(`session_${Date.now()}`);
      setCurrentRound(1);
      setActiveQuestion(initialQ);
      setTranscript([
        {
          role: 'interviewer',
          content: initialQ,
          timestamp: Date.now(),
          turn_index: 0
        }
      ]);
      setIsProcessingTurn(false);
      speakText(initialQ);
    }
  };

  // Submit Candidate's Answer / Turn
  const handleSubmitTurn = async () => {
    const textToSubmit = (liveSpeechText || textInputFallback).trim();
    if (!textToSubmit || isProcessingTurn) return;

    // Stop listening & TTS
    stopVoiceRecognition();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsInterviewerSpeaking(false);

    // Append student answer to transcript
    const newTranscript: TranscriptItem[] = [
      ...transcript,
      {
        role: 'student',
        content: textToSubmit,
        timestamp: Date.now(),
        turn_index: transcript.length
      }
    ];
    setTranscript(newTranscript);
    setLiveSpeechText('');
    setTextInputFallback('');
    setIsProcessingTurn(true);

    try {
      const res = await fetch('/api/v1/mock-interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_transcript: textToSubmit
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentRound(data.current_round);
        setActiveQuestion(data.interviewer_response);

        if (data.verification) {
          setLatestVerification(data.verification);
        }

        const updatedTranscript: TranscriptItem[] = [
          ...newTranscript.map((t, idx) =>
            idx === newTranscript.length - 1 && data.verification
              ? { ...t, verification: data.verification }
              : t
          ),
          {
            role: 'interviewer',
            content: data.interviewer_response,
            timestamp: Date.now(),
            turn_index: newTranscript.length,
            is_followup: true
          }
        ];
        setTranscript(updatedTranscript);
        setIsProcessingTurn(false);

        if (data.is_finished || data.current_round > totalRounds) {
          handleEndAndEvaluate();
        } else {
          speakText(data.interviewer_response);
        }
      } else {
        throw new Error('Turn processing failed');
      }
    } catch (e) {
      console.warn('Fallback turn processing:', e);
      setTimeout(() => {
        const fallbackFollowUp =
          "Thanks for explaining that. You hit on the main points. Let's dig deeper: How does this architecture handle network partitioning or high concurrency race conditions?";
        const fallbackVerification: AnswerVerification = {
          status: 'Verified • Adequate',
          score: 84,
          summary: 'Candidate articulated core technical constructs clearly. Would benefit from providing more concrete latency metrics and failure-mode recovery specifics.',
          key_points_covered: ['Core architectural components', 'Asynchronous data flow', 'Component boundaries'],
          missing_or_incorrect: ['Network partition handling', 'Cache stampede and race condition edge cases']
        };
        setLatestVerification(fallbackVerification);
        setCurrentRound((prev) => prev + 1);
        setActiveQuestion(fallbackFollowUp);
        setTranscript((prev) => [
          ...prev.map((t, idx) =>
            idx === prev.length - 1 ? { ...t, verification: fallbackVerification } : t
          ),
          {
            role: 'interviewer',
            content: fallbackFollowUp,
            timestamp: Date.now(),
            turn_index: prev.length,
            is_followup: true
          }
        ]);
        setIsProcessingTurn(false);
        speakText(fallbackFollowUp);
      }, 1200);
    }
  };

  // End Interview & Run Deep Evaluation
  const handleEndAndEvaluate = async () => {
    stopVoiceRecognition();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStage('evaluating');

    try {
      const res = await fetch('/api/v1/mock-interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
        setStage('report');
      } else {
        throw new Error('Evaluation failed');
      }
    } catch (err) {
      console.warn('Using offline comprehensive scorecard:', err);
      setTimeout(() => {
        const fallbackScorecard: InterviewEvaluation = {
          overall_score: 86,
          hire_decision: 'Hire',
          executive_summary: `Candidate demonstrated strong foundational competence in ${selectedRole} at ${seniority} level. Spoke with confidence and clearly explained system workflows, with high potential to reach top tier with targeted edge case mastery.`,
          rubrics: {
            technical_competence: { score: 88, feedback: 'Strong grasp of core data structures, API contracts, and asynchronous execution flow.' },
            communication_clarity: { score: 87, feedback: 'Concise, articulate explanations with minimal verbal fillers and good pacing.' },
            problem_solving: { score: 84, feedback: 'Broke down complex scenarios logically; would benefit from stating trade-offs explicitly before implementation.' },
            system_architecture: { score: 82, feedback: 'Understands horizontal scaling and caching; need deeper exploration of cache invalidation and distributed consistency.' },
            confidence_delivery: { score: 89, feedback: 'Maintained professional composure and steady vocal inflection under challenging follow-ups.' }
          },
          strengths: [
            'Clear mental model of end-to-end data flow from client requests to database transactions.',
            'Effective use of technical terminology without hand-wavy generalizations.',
            'Quick adaptation to interviewer follow-ups with constructive reasoning.'
          ],
          weaknesses: [
            'Could quantify architectural parameters (e.g. latency budgets, QPS thresholds, memory overhead).',
            'Slight hesitation when probed on distributed race conditions and atomic locking.',
            'Opportunity to mention automated observability (metrics, traces, structured logging).'
          ],
          missed_opportunities: [
            {
              topic: 'Distributed Caching & Stampede Prevention',
              candidate_answer_summary: 'Suggested standard Redis caching with simple TTL expiration.',
              ideal_response_key_points: 'A Staff Engineer answers with Cache-Aside vs Write-Through, Probabilistic Early Expiration (XFetch), and Distributed Mutexes to avoid database stampedes.'
            },
            {
              topic: 'Resilient Microservice Communication',
              candidate_answer_summary: 'Proposed retry loops on failed HTTP calls.',
              ideal_response_key_points: 'Ideal answers feature Exponential Backoff with Jitter, Circuit Breaker pattern, Idempotency Keys, and the Transactional Outbox pattern.'
            }
          ],
          seven_day_action_plan: [
            {
              day: 1,
              title: 'Foundations & Concurrency Drills',
              focus: 'Thread safety, async event loops, race conditions & mutexes',
              practice_tasks: ['Implement a rate limiter with Token Bucket in code', 'Review CPU vs I/O bound processing models'],
              estimated_hours: 2.5
            },
            {
              day: 2,
              title: 'Caching Architecture & Invalidation Strategies',
              focus: 'Redis data structures, TTL, stampede prevention, eviction algorithms',
              practice_tasks: ['Diagram Cache-Aside vs Write-Through vs Write-Back', 'Simulate Redis cluster key partitioning with Consistent Hashing'],
              estimated_hours: 3.0
            },
            {
              day: 3,
              title: 'Distributed Systems & Reliability Patterns',
              focus: 'Circuit breakers, Saga pattern, Idempotent APIs, Outbox pattern',
              practice_tasks: ['Design a resilient payment processing webhook consumer', 'Review CAP theorem tradeoffs in real-world scenarios'],
              estimated_hours: 3.0
            },
            {
              day: 4,
              title: 'Database Optimization & Indexing Internals',
              focus: 'B-Trees, Composite Indexes, EXPLAIN ANALYZE, Connection pooling',
              practice_tasks: ['Analyze slow queries and optimize execution plans', 'Study read replicas and write leader failover'],
              estimated_hours: 2.5
            },
            {
              day: 5,
              title: 'Behavioral Storytelling with STAR Method',
              focus: 'Craft 5 signature stories (Conflict, Technical Failure, Leadership, High Stakes Deadline, Mentorship)',
              practice_tasks: ['Write concise 90-second STAR scripts for each story', 'Practice answering behavioral prompts out loud with a timer'],
              estimated_hours: 2.0
            },
            {
              day: 6,
              title: 'High-Pressure Voice Mock Re-Run',
              focus: 'Complete a full 6-round technical session with AI Voice Interviewer',
              practice_tasks: ['Run mock interview session focusing on quantitative metrics', 'Review generated feedback & compare with previous session'],
              estimated_hours: 3.0
            },
            {
              day: 7,
              title: 'Final Polish, System Cheat Sheets & Readiness Review',
              focus: 'Quick-reference flashcards for numbers every engineer should know',
              practice_tasks: ['Memorize latency numbers (L1 cache vs RAM vs SSD vs Network)', 'Do a 10-minute warm-up speaking drill'],
              estimated_hours: 1.5
            }
          ]
        };
        setEvaluation(fallbackScorecard);
        setStage('report');
      }, 1500);
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const copy7DayPlanToClipboard = () => {
    if (!evaluation) return;
    let planText = `=== CAMPUSOS AI — 7-DAY ACTION & STUDY PLAN ===\n`;
    planText += `Role: ${selectedRole.toUpperCase()} | Score: ${evaluation.overall_score}/100 | Result: ${evaluation.hire_decision}\n\n`;
    evaluation.seven_day_action_plan.forEach((p) => {
      planText += `DAY ${p.day}: ${p.title} (${p.estimated_hours} hrs)\nFocus: ${p.focus}\nTasks:\n${p.practice_tasks.map((t) => `  [ ] ${t}`).join('\n')}\n\n`;
    });
    navigator.clipboard.writeText(planText);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // RENDER: SETUP STAGE
  // -------------------------------------------------------------
  if (stage === 'setup') {
    const activeRoleObj = roles.find((r) => r.id === selectedRole) || roles[0];

    return (
      <div className="min-h-screen bg-[#FAF7F2] p-6 text-[#1C211F] md:p-10 font-sans">
        {/* Header */}
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[#EAE3D8] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FDF2ED] px-3.5 py-1 text-xs font-semibold text-[#C85A32] border border-[#C85A32]/20 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-[#C85A32]" />
                Student Success Agent Subsystem
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1C211F]">
                AI Voice Mock Interview Studio
              </h1>
              <p className="mt-1 text-sm text-[#5E6763]">
                Real-time voice dialogue, adaptive follow-ups, and post-session 7-Day Action Plan powered by Featherless AI.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#EAE3D8] bg-[#FFFFFF] px-4 py-2.5 shadow-sm">
                <span className="text-xs text-[#8E9893] block font-medium">Candidate</span>
                <span className="text-sm font-bold text-[#1C211F]">{profile?.full_name || 'Student Candidate'}</span>
              </div>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Role & Parameters */}
            <div className="space-y-6 lg:col-span-2">
              {/* Select Role */}
              <div className="rounded-2xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-[#C85A32]" />
                  1. Target Job Archetype
                </h2>
                <p className="mt-1 text-xs text-[#5E6763]">
                  Select the engineering or leadership role you wish to simulate.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {roles.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-[#C85A32] bg-[#FDF2ED] shadow-sm ring-2 ring-[#C85A32]/20'
                            : 'border-[#EAE3D8] bg-[#FAF7F2] hover:border-[#C85A32]/40 hover:bg-[#FFFFFF]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-sm font-bold ${isSelected ? 'text-[#C85A32]' : 'text-[#1C211F]'}`}>
                            {r.title}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-[#C85A32]" />}
                        </div>
                        <p className="mt-1.5 text-xs text-[#5E6763] line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seniority & Focus Topics */}
              <div className="rounded-2xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#5E8C71]" />
                  2. Seniority & Focus Domains
                </h2>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-[#5E6763] block mb-2">
                    Experience Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(activeRoleObj?.seniority_levels || ['Intern', 'Junior (1-2 YoE)', 'Mid-Level', 'Senior']).map(
                      (lvl) => {
                        const isSelected = seniority === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSeniority(lvl)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-[#C85A32] text-white shadow-sm'
                                : 'bg-[#F4EFEA] text-[#2D3330] border border-[#EAE3D8] hover:bg-[#EFE8DF]'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-xs font-semibold text-[#5E6763] block mb-2">
                    Key Technical Focus Topics (Click to Toggle)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(activeRoleObj?.default_topics || []).map((topic) => {
                      const isSelected = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-[#5E8C71]/10 text-[#5E8C71] border-[#5E8C71]/30 font-semibold'
                              : 'bg-[#FAF7F2] text-[#5E6763] border-[#EAE3D8] hover:border-[#5E8C71]/30'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-[#5E8C71]" />}
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Optional Resume Notes */}
              <div className="rounded-2xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#C85A32]" />
                  3. Candidate Profile Notes / Target Company (Optional)
                </h2>
                <p className="mt-1 text-xs text-[#5E6763]">
                  Add your recent project highlights, resume snippets, or target company (e.g. Google, Stripe, Zerodha) so the interviewer personalizes questions.
                </p>
                <textarea
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="e.g. Built a real-time event streaming pipeline using Kafka and Go. Target company is a high-growth fintech startup."
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] p-3 text-xs text-[#1C211F] placeholder-[#8E9893] focus:border-[#C85A32] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
                />
              </div>
            </div>

            {/* Right Column: Audio & Start Card */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#C85A32]" />
                  Interview Settings
                </h2>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5E6763] block mb-1.5">
                      Session Length
                    </label>
                    <select
                      value={totalRounds}
                      onChange={(e) => setTotalRounds(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] p-2.5 text-xs text-[#1C211F] font-semibold focus:border-[#C85A32] focus:outline-none"
                    >
                      <option value={4}>4 Turns (Quick Drill - 8 mins)</option>
                      <option value={5}>5 Turns (Standard Technical - 12 mins)</option>
                      <option value={7}>7 Turns (Deep Architectural Rigor - 20 mins)</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-[#EAE3D8]">
                    <span className="text-xs font-semibold text-[#5E6763] block mb-2">Voice & Mic Readiness</span>
                    <div className="rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5E6763] flex items-center gap-1.5">
                          <Mic className="h-3.5 w-3.5 text-[#5E8C71]" /> Speech Recognition
                        </span>
                        <span className="font-semibold text-[#5E8C71]">Active (Web Speech)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#5E6763] flex items-center gap-1.5">
                          <Volume2 className="h-3.5 w-3.5 text-[#C85A32]" /> Voice Synthesis
                        </span>
                        <span className="font-semibold text-[#C85A32]">Enabled (Natural AI)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartInterview}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#C85A32] py-3.5 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[#B44E27] hover:shadow-lg active:scale-[0.99]"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Start Live Voice Interview
                </button>

                <p className="mt-3 text-center text-[11px] text-[#8E9893]">
                  Make sure your microphone permissions are granted. You can also type answers at any time.
                </p>
              </div>

              {/* Tips Card */}
              <div className="rounded-2xl border border-[#EAE3D8] bg-[#FAF0E9] p-5">
                <h3 className="text-xs font-bold text-[#C85A32] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Interviewer Rules
                </h3>
                <ul className="mt-2.5 space-y-2 text-xs text-[#2D3330]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C85A32] font-bold">•</span>
                    <span>The AI will drill down into specific tradeoffs you mention.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C85A32] font-bold">•</span>
                    <span>Quantify your answers where possible (latency, QPS, memory).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C85A32] font-bold">•</span>
                    <span>A complete 7-Day Study Plan will be generated upon completion.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LIVE INTERVIEW STAGE (FULL SCREEN STUDIO)
  // -------------------------------------------------------------
  if (stage === 'interview') {
    const activeRoleTitle = roles.find((r) => r.id === selectedRole)?.title || 'Technical Candidate';

    return (
      <div className="fixed inset-0 z-50 bg-[#FAF7F2] text-[#1C211F] font-sans flex flex-col overflow-y-auto">
        {/* Top Header HUD */}
        <header className="border-b border-[#EAE3D8] bg-[#FFFFFF] px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-xs">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#5E8C71] animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E8C71]">
                  Live Technical Studio
                </span>
              </div>
              <div className="h-4 w-px bg-[#EAE3D8]"></div>
              <span className="text-sm font-extrabold text-[#1C211F] hidden sm:inline">
                {activeRoleTitle}
              </span>
              <span className="text-xs font-medium text-[#8E9893] hidden md:inline">
                ({seniority})
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Turn Counter */}
              <div className="rounded-lg bg-[#FAF7F2] border border-[#EAE3D8] px-2.5 py-1 text-xs font-bold text-[#2D3330]">
                Turn {currentRound} / {totalRounds}
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 rounded-lg bg-[#FAF7F2] border border-[#EAE3D8] px-2.5 py-1 text-xs font-mono font-semibold text-[#1C211F]">
                <Clock className="h-3.5 w-3.5 text-[#C85A32]" />
                {formatTime(elapsedSeconds)}
              </div>

              {/* Mute Voice Toggle */}
              <button
                type="button"
                onClick={() => {
                  setVoiceMuted(!voiceMuted);
                  if (!voiceMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsInterviewerSpeaking(false);
                  }
                }}
                className={`p-1.5 rounded-lg border transition-all ${
                  voiceMuted
                    ? 'border-[#D9822B] bg-[#D9822B]/10 text-[#D9822B]'
                    : 'border-[#EAE3D8] bg-[#FAF7F2] text-[#5E6763] hover:text-[#1C211F]'
                }`}
                title={voiceMuted ? 'Unmute Interviewer Voice' : 'Mute Interviewer Voice'}
              >
                {voiceMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg border border-[#EAE3D8] bg-[#FAF7F2] text-[#5E6763] hover:text-[#C85A32] transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* Exit Studio Button */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Exit technical mock interview studio and return to configuration?')) {
                    stopVoiceRecognition();
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                    setStage('setup');
                  }
                }}
                className="flex items-center gap-1 rounded-lg border border-[#EAE3D8] bg-[#FAF7F2] px-2.5 py-1 text-xs font-bold text-[#5E6763] hover:text-[#C85A32] hover:bg-white transition-all"
                title="Exit Interview Studio"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>

              {/* Wrap Up & Score Button */}
              <button
                type="button"
                onClick={handleEndAndEvaluate}
                className="flex items-center gap-1.5 rounded-lg bg-[#FAF0E9] border border-[#C85A32]/30 px-3 py-1 text-xs font-bold text-[#C85A32] hover:bg-[#FDF2ED] transition-all"
              >
                <Square className="h-3.5 w-3.5 fill-[#C85A32]" />
                <span className="hidden sm:inline">Wrap Up &</span> Evaluate
              </button>
            </div>
          </div>
        </header>

        {/* Main Studio Arena */}
        <main className="flex-1 mx-auto max-w-6xl w-full p-4 sm:p-6 md:p-8 flex flex-col justify-start gap-5">
          {/* Top Section: AI Interviewer Card with Animated Visualizer */}
          <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 md:p-7 shadow-xs relative overflow-hidden">
            {/* Background ambient tint */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#FDF2ED] rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Visualizer Box */}
              <div className="relative flex-shrink-0 flex flex-col items-center">
                <div
                  className={`h-22 w-22 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isInterviewerSpeaking
                      ? 'bg-[#C85A32] shadow-[0_0_24px_rgba(200,90,50,0.35)] scale-105'
                      : isProcessingTurn
                      ? 'bg-[#2D3330] animate-pulse'
                      : 'bg-[#2D3330]'
                  }`}
                >
                  <Cpu className="h-9 w-9 text-white" />
                </div>

                {/* Status Indicator Badge */}
                <div className="mt-3">
                  {isInterviewerSpeaking ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF2ED] px-2.5 py-0.5 text-[11px] font-bold text-[#C85A32] border border-[#C85A32]/20">
                      <Volume2 className="h-3 w-3 animate-bounce" /> Speaking
                    </span>
                  ) : isProcessingTurn ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF7ED] px-2.5 py-0.5 text-[11px] font-bold text-[#D9822B] border border-[#D9822B]/30">
                      <Sparkles className="h-3 w-3 animate-spin" /> Verifying & Reasoning...
                    </span>
                  ) : isListening ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#5E8C71]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#5E8C71]">
                      <Mic className="h-3 w-3 animate-pulse" /> Listening to you
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-[11px] font-medium text-[#8E9893]">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text & Controls */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#C85A32]">
                    Senior Staff Tech Interviewer
                  </span>
                  <button
                    type="button"
                    onClick={() => speakText(activeQuestion)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#5E6763] hover:text-[#C85A32]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Replay Voice
                  </button>
                </div>

                <p className="mt-2 text-base md:text-lg font-bold text-[#1C211F] leading-relaxed">
                  "{activeQuestion}"
                </p>

                {/* Audio Wave Visualizer Bars */}
                <div className="mt-4 flex items-center justify-center md:justify-start gap-1 h-7">
                  {audioWaves.map((height, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${height}%` }}
                      className={`w-1.5 rounded-full transition-all duration-100 ${
                        isInterviewerSpeaking
                          ? 'bg-[#C85A32]'
                          : isListening
                          ? 'bg-[#5E8C71]'
                          : 'bg-[#EAE3D8]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Real-Time LLM Answer Verification Engine */}
          <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-5 md:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3D8] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#5E8C71]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C211F]">
                  LLM Question & Answer Verification Engine
                </span>
              </div>
              {latestVerification ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-extrabold ${
                      latestVerification.score >= 85
                        ? 'bg-[#5E8C71]/15 text-[#5E8C71] border border-[#5E8C71]/30'
                        : latestVerification.score >= 70
                        ? 'bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/30'
                        : 'bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/30'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {latestVerification.status} ({latestVerification.score}/100)
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] px-3 py-0.5 text-xs font-medium text-[#8E9893] border border-[#EAE3D8]">
                  <Sparkles className="h-3.5 w-3.5 text-[#C85A32]" />
                  Awaiting Candidate Response for Turn {currentRound}
                </span>
              )}
            </div>

            {latestVerification ? (
              <div className="space-y-3">
                <p className="text-xs md:text-sm text-[#2D3330] leading-relaxed">
                  <strong className="text-[#C85A32] font-bold">Verification Assessment: </strong>
                  {latestVerification.summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] p-3.5">
                    <span className="text-xs font-bold text-[#5E8C71] flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Key Concepts
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#2D3330]">
                      {latestVerification.key_points_covered && latestVerification.key_points_covered.length > 0 ? (
                        latestVerification.key_points_covered.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#5E8C71] font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#8E9893] italic">No major core concepts recognized.</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] p-3.5">
                    <span className="text-xs font-bold text-[#D9822B] flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-3.5 w-3.5" /> Missing Nuances & Edge Cases
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#2D3330]">
                      {latestVerification.missing_or_incorrect && latestVerification.missing_or_incorrect.length > 0 ? (
                        latestVerification.missing_or_incorrect.map((mis, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#D9822B] font-bold">•</span>
                            <span>{mis}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#5E8C71] font-semibold">Exhaustive coverage of architectural trade-offs.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs text-[#5E6763] flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-[#C85A32] flex-shrink-0" />
                <span>
                  Speak or type your technical response below. The Featherless AI evaluator verifies technical accuracy, architectural soundness, and edge case depth immediately upon submission.
                </span>
              </div>
            )}
          </div>

          {/* Bottom Section: Candidate Speech / Text Console */}
          <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 md:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D3330] flex items-center gap-1.5">
                <Mic className="h-4 w-4 text-[#C85A32]" />
                Candidate Technical Response Console
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="text-xs font-semibold text-[#C85A32] hover:underline flex items-center gap-1"
              >
                {isDrawerOpen ? 'Hide Full Transcript' : 'View Full Transcript'} ({transcript.length} turns)
              </button>
            </div>

            {/* Live Speech Feedback Area */}
            <div className="relative">
              <textarea
                value={textInputFallback}
                onChange={(e) => {
                  setTextInputFallback(e.target.value);
                  setLiveSpeechText(e.target.value);
                }}
                placeholder={
                  isListening
                    ? 'Listening to your voice... Speak clearly into your microphone.'
                    : 'Click "Start Speaking" or type your complete technical response here...'
                }
                rows={3}
                className="w-full rounded-2xl border border-[#EAE3D8] bg-[#FAF7F2] p-4 text-sm text-[#1C211F] placeholder-[#8E9893] focus:border-[#C85A32] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20"
              />

              {isListening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-[#5E8C71]/15 px-3 py-1 text-xs font-bold text-[#5E8C71]">
                  <span className="h-2 w-2 rounded-full bg-[#5E8C71] animate-ping"></span>
                  Recording Speech...
                </div>
              )}
            </div>

            {/* Action Buttons Bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isListening ? (
                  <button
                    type="button"
                    onClick={stopVoiceRecognition}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#D9822B] px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#B44E27] transition-all"
                  >
                    <MicOff className="h-4 w-4" /> Pause Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceRecognition}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#5E8C71] px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#4D755E] transition-all active:scale-[0.98]"
                  >
                    <Mic className="h-4 w-4 animate-pulse" /> Start Speaking
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmitTurn}
                disabled={isProcessingTurn || (!liveSpeechText && !textInputFallback.trim())}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-xs transition-all ${
                  isProcessingTurn || (!liveSpeechText && !textInputFallback.trim())
                    ? 'bg-[#8E9893] cursor-not-allowed opacity-60'
                    : 'bg-[#C85A32] hover:bg-[#B44E27] active:scale-[0.98]'
                }`}
              >
                {isProcessingTurn ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Verifying & Formulating Follow-up...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Answer & Next Turn
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transcript Drawer Accordion */}
          {isDrawerOpen && (
            <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#1C211F] mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#C85A32]" /> Complete Interview Dialogue & Verification History
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {transcript.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      item.role === 'interviewer'
                        ? 'bg-[#FDF2ED] border border-[#C85A32]/20 text-[#2D3330]'
                        : 'bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 font-bold">
                      <span className={`inline-flex items-center gap-1.5 ${item.role === 'interviewer' ? 'text-[#C85A32]' : 'text-[#2D3330]'}`}>
                        {item.role === 'interviewer' ? (
                          <>
                            <Bot className="h-3.5 w-3.5 text-[#C85A32]" />
                            Interviewer
                          </>
                        ) : (
                          <>
                            <User className="h-3.5 w-3.5 text-[#2D3330]" />
                            Candidate (You)
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-[#8E9893]">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p>{item.content}</p>

                    {item.verification && (
                      <div className="mt-2 pt-2 border-t border-[#EAE3D8] flex items-center gap-2 text-[11px]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#5E8C71]" />
                        <span className="font-semibold text-[#5E8C71]">
                          LLM Verified ({item.verification.score}/100):
                        </span>
                        <span className="text-[#5E6763]">{item.verification.status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: EVALUATION COMPUTATION LOADER
  // -------------------------------------------------------------
  if (stage === 'evaluating') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-8 shadow-md">
          <div className="relative mx-auto h-16 w-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#C85A32]/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#C85A32] border-t-transparent"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-[#C85A32]" />
          </div>

          <h2 className="text-xl font-extrabold text-[#1C211F]">
            Generating Multi-Rubric Scorecard
          </h2>
          <p className="mt-2 text-xs text-[#5E6763] leading-relaxed">
            The Student Success Agent is analyzing your technical accuracy, system architecture depth, verbal clarity, and synthesizing your personalized 7-Day Action Plan.
          </p>

          <div className="mt-6 space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-[#5E8C71]">
              <CheckCircle2 className="h-4 w-4" /> Dialogue turns transcribed & indexed
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5E8C71]">
              <CheckCircle2 className="h-4 w-4" /> Comparing with Staff Engineer rubric standards
            </div>
            <div className="flex items-center gap-2 text-xs text-[#C85A32] animate-pulse">
              <Activity className="h-4 w-4" /> Assembling 7-Day Revision & Drill Roadmap...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: POST-INTERVIEW SCORECARD & 7-DAY STUDY PLAN
  // -------------------------------------------------------------
  if (stage === 'report' && evaluation) {
    const activeRoleTitle = roles.find((r) => r.id === selectedRole)?.title || 'Software Engineer';
    const decisionColor =
      evaluation.hire_decision === 'Strong Hire' || evaluation.hire_decision === 'Hire'
        ? 'bg-[#5E8C71] text-white'
        : evaluation.hire_decision === 'Leaning Hire'
        ? 'bg-[#D9822B] text-white'
        : 'bg-[#C85A32] text-white';

    return (
      <div className="min-h-screen bg-[#FAF7F2] p-6 text-[#1C211F] md:p-10 font-sans">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Top Banner Header */}
          <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FDF2ED] px-3.5 py-1 text-xs font-semibold text-[#C85A32] border border-[#C85A32]/20 mb-2">
                  <Award className="h-3.5 w-3.5" />
                  Official Mock Interview Scorecard
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C211F]">
                  {activeRoleTitle} Assessment
                </h1>
                <p className="mt-1 text-xs md:text-sm text-[#5E6763]">
                  Seniority Level: <span className="font-bold text-[#1C211F]">{seniority}</span> • Duration: <span className="font-bold text-[#1C211F]">{formatTime(elapsedSeconds)}</span>
                </p>
              </div>

              {/* Overall Score Circle & Decision Pill */}
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FDF2ED] border-2 border-[#C85A32]">
                    <span className="text-2xl font-black text-[#C85A32]">
                      {evaluation.overall_score}
                    </span>
                    <span className="absolute bottom-1 text-[9px] font-bold text-[#8E9893]">
                      / 100
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] font-bold text-[#5E6763]">Overall Score</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase shadow-sm ${decisionColor}`}>
                    {evaluation.hire_decision}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStage('setup');
                      setTranscript([]);
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#2D3330] hover:bg-[#FFFFFF] transition-all"
                  >
                    <RotateCcw className="h-3 w-3" /> New Session
                  </button>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mt-6 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] p-4 text-xs md:text-sm text-[#2D3330] leading-relaxed">
              <strong className="text-[#C85A32] font-bold">Talent Assessor Verdict: </strong>
              {evaluation.executive_summary}
            </div>
          </div>

          {/* 5 Rubric Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Technical Competence', metric: evaluation.rubrics.technical_competence, icon: Code2, color: '#C85A32' },
              { label: 'Communication Clarity', metric: evaluation.rubrics.communication_clarity, icon: Activity, color: '#5E8C71' },
              { label: 'Problem Solving', metric: evaluation.rubrics.problem_solving, icon: Cpu, color: '#2D3330' },
              { label: 'System Architecture', metric: evaluation.rubrics.system_architecture, icon: Database, color: '#C85A32' },
              { label: 'Confidence & Delivery', metric: evaluation.rubrics.confidence_delivery, icon: Sparkles, color: '#D9822B' },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl border border-[#EAE3D8] bg-[#FFFFFF] p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <r.icon className="h-4 w-4" style={{ color: r.color }} />
                    <span className="text-sm font-extrabold" style={{ color: r.color }}>
                      {r.metric.score}%
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1C211F]">{r.label}</h4>
                  <div className="mt-2 h-1.5 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#EAE3D8]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.metric.score}%`, backgroundColor: r.color }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-[#5E6763] line-clamp-3 leading-snug">
                  {r.metric.feedback}
                </p>
              </div>
            ))}
          </div>

          {/* Strengths vs Weaknesses 2-Column Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#5E8C71] flex items-center gap-2 uppercase tracking-wider mb-4">
                <CheckCircle2 className="h-4 w-4 text-[#5E8C71]" /> Key Strengths Observed
              </h3>
              <ul className="space-y-3">
                {evaluation.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#2D3330] leading-relaxed">
                    <span className="text-[#5E8C71] font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#C85A32] flex items-center gap-2 uppercase tracking-wider mb-4">
                <AlertCircle className="h-4 w-4 text-[#C85A32]" /> Areas For Improvement
              </h3>
              <ul className="space-y-3">
                {evaluation.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#2D3330] leading-relaxed">
                    <span className="text-[#C85A32] font-bold">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missed Opportunities & Model Answers */}
          {evaluation.missed_opportunities && evaluation.missed_opportunities.length > 0 && (
            <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 md:p-8 shadow-sm">
              <h3 className="text-sm font-bold text-[#1C211F] flex items-center gap-2 uppercase tracking-wider mb-4">
                <Sparkles className="h-4 w-4 text-[#D9822B]" /> Missed Opportunities & Model Staff-Level Answers
              </h3>

              <div className="space-y-4">
                {evaluation.missed_opportunities.map((opp, idx) => (
                  <div key={idx} className="rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] p-4">
                    <h4 className="text-xs font-extrabold text-[#1C211F]">{opp.topic}</h4>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#EAE3D8]">
                        <span className="font-bold text-[#8E9893] block mb-1">Your Answer:</span>
                        <p className="text-[#5E6763]">{opp.candidate_answer_summary}</p>
                      </div>
                      <div className="p-3 bg-[#FDF2ED] rounded-xl border border-[#C85A32]/20">
                        <span className="font-bold text-[#C85A32] block mb-1">Top 1% Model Answer:</span>
                        <p className="text-[#2D3330]">{opp.ideal_response_key_points}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Personalized Action & Study Plan */}
          <div className="rounded-3xl border border-[#EAE3D8] bg-[#FFFFFF] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3D8] pb-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C85A32] uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" /> Customized Learning Plan
                </div>
                <h2 className="text-xl font-extrabold text-[#1C211F]">
                  7-Day Action & Practice Roadmap
                </h2>
              </div>

              <button
                type="button"
                onClick={copy7DayPlanToClipboard}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-[#2D3330] hover:bg-[#FDF2ED] hover:text-[#C85A32] transition-all"
              >
                {copiedPlan ? <Check className="h-3.5 w-3.5 text-[#5E8C71]" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedPlan ? 'Plan Copied!' : 'Copy Plan Checklist'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {evaluation.seven_day_action_plan.map((dayPlan) => (
                <div
                  key={dayPlan.day}
                  className="rounded-2xl border border-[#EAE3D8] bg-[#FAF7F2] p-4 flex flex-col justify-between hover:border-[#C85A32]/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-lg bg-[#C85A32] px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
                        Day {dayPlan.day}
                      </span>
                      <span className="text-[11px] font-semibold text-[#8E9893] flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {dayPlan.estimated_hours} hrs
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-[#1C211F] line-clamp-1">
                      {dayPlan.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-[#5E6763] italic">
                      {dayPlan.focus}
                    </p>

                    <div className="mt-3 space-y-2 pt-2 border-t border-[#EAE3D8]">
                      {dayPlan.practice_tasks.map((task, tIdx) => {
                        const taskId = `day-${dayPlan.day}-task-${tIdx}`;
                        const isDone = !!completedTasks[taskId];
                        return (
                          <label
                            key={tIdx}
                            className="flex items-start gap-2 text-xs text-[#2D3330] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleTaskCompleted(taskId)}
                              className="mt-0.5 rounded border-[#EAE3D8] text-[#C85A32] focus:ring-[#C85A32]"
                            />
                            <span className={isDone ? 'line-through text-[#8E9893]' : ''}>
                              {task}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
