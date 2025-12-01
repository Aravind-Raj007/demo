import Link from "next/link";
import Image from "next/image";
import { TEMPLATES } from "@/data/templates";
import { ArrowRight, Play } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-xl">AdCreator</span>
          </div>
          <nav>
            <Link href="/editor" className="text-sm font-medium hover:text-primary transition-colors">
              Open Editor
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-gray-500">
            Create Stunning Video Ads
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose a template and start creating professional animated ads in seconds. 
            No video editing skills required.
          </p>
          <Link 
            href="/editor" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Start Creating <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Templates Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-8">Popular Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template) => (
              <Link 
                key={template.id} 
                href={`/editor?template=${template.id}`}
                className="group block border border-border rounded-xl overflow-hidden hover:border-primary transition-colors bg-card"
              >
                <div className="aspect-video relative bg-muted">
                  {/* Placeholder for thumbnail since we don't have real images yet */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <span className="text-sm">Preview: {template.name}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
                      Use Template
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{template.duration}s duration</span>
                    <span>{template.layers.length} layers</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
