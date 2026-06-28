import { useNavigate } from 'react-router-dom'
import { Sparkles, BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen gradient-mesh-auth flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Learning Hub</h1>
              <p className="text-sm text-muted-foreground">AI Study Workspace</p>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Welcome to Your<br />AI-Powered Learning Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your role to get started with personalized features and tools
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Student Card */}
          <button
            onClick={() => navigate('/register?role=student')}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated/80 backdrop-blur-sm p-8 text-left transition-all duration-300 hover:shadow-lift hover:-translate-y-1 hover:border-primary/30"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">I am a Student</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Learn, practice, and grow with AI-powered tools. Access courses, generate quizzes, and chat with AI tutor.
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Lecturer Card */}
          <button
            onClick={() => navigate('/register?role=lecturer')}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated/80 backdrop-blur-sm p-8 text-left transition-all duration-300 hover:shadow-lift hover:-translate-y-1 hover:border-accent/30"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">I am a Lecturer</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Create courses, manage students, and leverage AI to enhance teaching. Track progress and provide feedback.
                </p>
              </div>
              <div className="flex items-center gap-2 text-accent font-medium text-sm">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-8">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-elevated/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Smart Courses</p>
              <p className="text-xs text-muted-foreground">AI-enhanced learning</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-elevated/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Collaborative</p>
              <p className="text-xs text-muted-foreground">Learn together</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-elevated/50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">AI Powered</p>
              <p className="text-xs text-muted-foreground">Smart assistant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
