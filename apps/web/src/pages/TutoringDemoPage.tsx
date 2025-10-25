import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function TutoringDemoPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [documents, setDocuments] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const { toast } = useToast();

  const handleDemoAnalysis = async () => {
    if (!studentName || !studentGrade || !documents) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to see the demo.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call the demo tutoring analysis endpoint (no auth required)
      const response = await fetch('/api/demo-analyze-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleType: 'tutoring',
          caseId: `demo-${Date.now()}`,
          studentName,
          studentGrade,
          documents: [
            {
              filename: 'student_assessment.txt',
              content: documents
            }
          ]
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedReport(result.markdown_report);
        setAnalysisComplete(true);
        toast({
          title: "Demo Complete!",
          description: "Your tutoring assessment report has been generated with strict schema formatting.",
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      toast({
        title: "Demo Error",
        description: "Something went wrong with the demo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDemo = () => {
    setAnalysisComplete(false);
    setStudentName('');
    setStudentGrade('');
    setDocuments('');
    setGeneratedReport('');
  };

  if (analysisComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-green-600">Demo Complete!</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Here's your AI-generated tutoring assessment report with strict JSON schema
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Strict Schema
              </Badge>
              <Badge variant="secondary">3 Strengths</Badge>
              <Badge variant="secondary">4 Challenges</Badge>
              <Badge variant="secondary">Comprehensive K-12 Focus</Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Report for {studentName}
              </CardTitle>
              <CardDescription>
                Professional tutoring assessment with actionable insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                  {generatedReport}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button onClick={resetDemo} variant="outline">
              Try Another Demo
            </Button>
            <Button className="gap-2">
              Get Started with Your Tutoring Business
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold">Tutoring Assessment Demo</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how our AI generates comprehensive tutoring reports with strict formatting 
            perfect for tracking student progress and billing
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              7,960-character K-12 special education system
            </Badge>
            <Badge variant="outline">Consistent JSON structure</Badge>
            <Badge variant="outline">Evidence-based insights</Badge>
          </div>
        </div>

        {/* Demo Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Try the Demo
            </CardTitle>
            <CardDescription>
              Enter sample student information to see our AI-powered tutoring assessment in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  placeholder="e.g., Emma Rodriguez"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentGrade">Grade Level</Label>
                <Input
                  id="studentGrade"
                  placeholder="e.g., Grade 4"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documents">Student Assessment Information</Label>
              <Textarea
                id="documents"
                placeholder="Enter details about the student's learning profile, strengths, challenges, diagnoses, etc. For example: 'Emma is a 4th-grade student with a specific learning disability in written expression. She demonstrates strong verbal communication skills and excels in creative storytelling but struggles significantly with spelling, punctuation, and organizing her thoughts in writing...'"
                value={documents}
                onChange={(e) => setDocuments(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleDemoAnalysis} 
              disabled={isAnalyzing || !studentName || !studentGrade || !documents}
              className="w-full gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating Assessment...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Demo Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Strict Schema</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Exactly 3 strengths and 4 challenges every time for consistent reporting
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">K-12 Expertise</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Comprehensive special education approach with 7,960-character system prompt
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Business Ready</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Professional format perfect for client communication and progress tracking
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}