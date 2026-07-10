import { useNavigate } from 'react-router-dom'
import { Sparkles, BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen gradient-mesh-auth flex items-center justify-center p-6 relative overflow-hidden font-body">
      {/* Decorative Orbs */}
      <div className="orb bg-blue-500 w-72 h-72 -top-20 -left-20" />
      <div className="orb bg-purple-500 w-96 h-96 -bottom-32 -right-20" />
      <div className="orb bg-cyan-400 w-64 h-64 top-1/3 right-1/4" />

      <div className="max-w-4xl w-full space-y-12 animate-fade-in relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-extrabold text-foreground leading-tight tracking-tight">Learning Hub</h1>
              <p className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground">AI Study Workspace</p>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            Welcome to Your<br />
            <span className="gradient-text-animated">AI-Powered</span> Learning Hub
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Experience next-generation collaborative learning. Choose your role below to access dedicated tools.
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Student Card */}
          <button
            onClick={() => navigate('/register?role=student')}
            className="group relative overflow-hidden rounded-2xl border border-blue-500/15 bg-surface-elevated/70 backdrop-blur-md p-8 text-left transition-all duration-300 hover:shadow-lift hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-blue-500/5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-cyan-500 group-hover:text-white transition-all duration-300">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  I am a Student
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Generate instant quizzes, study with interactive flashcards, and prompt our smart AI Tutor.
                </p>
              </div>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-xs">
                Access Student Suite
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Lecturer Card */}
          <button
            onClick={() => navigate('/register?role=lecturer')}
            className="group relative overflow-hidden rounded-2xl border border-purple-500/15 bg-surface-elevated/70 backdrop-blur-md p-8 text-left transition-all duration-300 hover:shadow-lift hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-purple-500/5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-violet-600 group-hover:text-white transition-all duration-300">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1.5">I am a Lecturer</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Design smart courses, catalog documents in libraries, and access student analytics.
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-500 font-bold text-xs">
                Access Teacher Suite
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an active account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-8 border-t border-border/40">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-elevated/40 p-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs">Smart Courses</p>
              <p className="text-3xs text-muted-foreground">Personalized curriculum plans</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-elevated/40 p-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs">AI Chatbots</p>
              <p className="text-3xs text-muted-foreground">24/7 contextual answers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-elevated/40 p-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-xs">Smart Grading</p>
              <p className="text-3xs text-muted-foreground">AI-assisted response review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
