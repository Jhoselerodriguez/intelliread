import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileSearch, 
  Image, 
  Brain, 
  Layers, 
  Database, 
  Search,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PipelineStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  color: string;
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 1,
    title: 'PDF Upload',
    description: 'User selects a PDF file which is loaded into browser memory',
    icon: <Upload className="w-6 h-6" />,
    details: [
      'File is read using the File API',
      'PDF binary is stored temporarily in memory',
      'No server upload - 100% client-side'
    ],
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Local PDF Analysis',
    description: 'Document structure and content types are detected',
    icon: <FileSearch className="w-6 h-6" />,
    details: [
      'Total page count is determined',
      'Each page is classified: text, image, or mixed',
      'Document metadata is extracted (title, author, etc.)'
    ],
    color: 'bg-purple-500'
  },
  {
    id: 3,
    title: 'Text & Image Extraction',
    description: 'Content is extracted based on page type',
    icon: <Layers className="w-6 h-6" />,
    details: [
      'Text pages: Direct text extraction via PDF.js',
      'Image detection: Pages are scanned for embedded images',
      'Layout analysis: Headings, paragraphs, and lists identified'
    ],
    color: 'bg-green-500'
  },
  {
    id: 4,
    title: 'Image-Only Page Handling',
    description: 'Visual content is analyzed using AI',
    icon: <Image className="w-6 h-6" />,
    details: [
      'Image-only pages are rendered to PNG',
      'Gemini AI generates detailed descriptions',
      'Descriptions become searchable page content'
    ],
    color: 'bg-orange-500'
  },
  {
    id: 5,
    title: 'Content Normalization',
    description: 'All extracted content is unified into a standard format',
    icon: <Brain className="w-6 h-6" />,
    details: [
      'Text and image descriptions are merged',
      'Page-level content is structured',
      'Metadata is attached: source page, content type'
    ],
    color: 'bg-pink-500'
  },
  {
    id: 6,
    title: 'Chunking & Structuring',
    description: 'Content is split into logical, searchable units',
    icon: <Layers className="w-6 h-6" />,
    details: [
      'Sections are identified by headings',
      'Content is chunked at sentence boundaries',
      'Each chunk includes: page, section, source metadata'
    ],
    color: 'bg-teal-500'
  },
  {
    id: 7,
    title: 'Local Indexing',
    description: 'Chunks are indexed in browser storage',
    icon: <Database className="w-6 h-6" />,
    details: [
      'Stored in IndexedDB (persistent browser storage)',
      'Searchable structures are built',
      'Ready for instant retrieval'
    ],
    color: 'bg-indigo-500'
  },
  {
    id: 8,
    title: 'Search & Q&A Ready',
    description: 'User can now interact with the document',
    icon: <Search className="w-6 h-6" />,
    details: [
      'Semantic search across all content',
      'AI-powered question answering',
      'Navigate by section and page'
    ],
    color: 'bg-emerald-500'
  }
];

const explanationCards = [
  {
    title: 'PDF Analysis',
    content: 'Every PDF page is analyzed to determine its content type. This classification drives the processing path: text extraction for readable content, image rendering for visual content.'
  },
  {
    title: 'Image-Only Page Detection',
    content: 'Pages with minimal or no extractable text but containing images are flagged as "image-only". These pages are rendered as images and sent to AI for description generation.'
  },
  {
    title: 'AI Image Understanding',
    content: 'Google Gemini API processes rendered page images to generate detailed textual descriptions. This makes charts, diagrams, and scanned content fully searchable.'
  },
  {
    title: 'Chunking Strategy',
    content: 'Content is never split mid-sentence. Chunks are created at natural boundaries (section headings, paragraph breaks) while respecting size limits for efficient retrieval.'
  },
  {
    title: 'Local Indexing',
    content: 'All processed data is stored in IndexedDB, a persistent browser database. No external servers are involved - your documents never leave your device.'
  },
  {
    title: 'Query Processing',
    content: 'When you ask a question, relevant chunks are retrieved using semantic similarity. The AI provider then generates answers with citations back to specific pages.'
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipelineSteps.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-gradient px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-header-foreground hover:bg-header-foreground/10">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-header-foreground">How Document Processing Works</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            From PDF to Searchable Knowledge
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            IntelliRead transforms your PDFs into structured, searchable knowledge using a sophisticated 
            client-side processing pipeline. Here's exactly what happens when you upload a document.
          </p>
        </div>

        {/* Animated Pipeline */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Processing Pipeline</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? 'Pause Animation' : 'Resume Animation'}
            </Button>
          </div>

          {/* Pipeline Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-border hidden lg:block" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {pipelineSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    activeStep === index ? 'scale-105' : 'scale-100 opacity-70'
                  }`}
                  onClick={() => {
                    setActiveStep(index);
                    setIsAnimating(false);
                  }}
                >
                  {/* Step Circle */}
                  <div className={`
                    relative z-10 w-16 h-16 mx-auto rounded-full flex items-center justify-center
                    transition-all duration-300 text-white
                    ${activeStep === index ? step.color : 'bg-muted-foreground/30'}
                    ${activeStep === index ? 'ring-4 ring-primary/20' : ''}
                  `}>
                    {activeStep > index ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <p className={`
                    text-xs text-center mt-2 font-medium transition-colors duration-300
                    ${activeStep === index ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Step Details */}
          <Card className="mt-8 border-2 animate-fade-in" key={activeStep}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${pipelineSteps[activeStep].color}`}>
                  {pipelineSteps[activeStep].icon}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Step {activeStep + 1}: {pipelineSteps[activeStep].title}
                  </CardTitle>
                  <CardDescription>
                    {pipelineSteps[activeStep].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pipelineSteps[activeStep].details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Explanation Cards */}
        <section className="mb-16">
          <h3 className="text-xl font-semibold text-foreground mb-6">Technical Deep Dive</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {explanationCards.map((card, idx) => (
              <Card key={idx} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Highlights */}
        <section className="mb-16">
          <h3 className="text-xl font-semibold text-foreground mb-6">Key Highlights</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-card border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">100% Local Processing</h4>
              <p className="text-sm text-muted-foreground">
                All document processing happens in your browser. Your PDFs never leave your device.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Images as First-Class Content</h4>
              <p className="text-sm text-muted-foreground">
                Visual content is analyzed by AI and converted to searchable text descriptions.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Smart Chunking</h4>
              <p className="text-sm text-muted-foreground">
                Content is split at natural boundaries, never mid-sentence, preserving context.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to IntelliRead
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}