import { FileText, Brain, Lock } from 'lucide-react';

export const FeatureCards = () => {
  const features = [
    {
      icon: FileText,
      title: 'Smart Extraction',
      description: 'Automatically extract text, analyze themes, and generate summaries with AI',
    },
    {
      icon: Brain,
      title: 'Intelligent Q&A',
      description: 'Ask questions and get accurate answers with citations from your documents',
    },
    {
      icon: Lock,
      title: '100% Private',
      description: 'All PDF processing happens locally. Your documents never leave your device.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-6">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className="panel-card p-6 animate-fade-in"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg mb-4">
            <feature.icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};
