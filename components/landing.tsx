import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 py-12 md:py-16">
              <h1 className="text-3xl md:text-4xl font-bold">
                Chat with your documentation using AI
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Load documentation from URLs or upload files, then ask questions
                and get intelligent answers.
              </p>
              <Link href="/home">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
              <Image
                src="/chat.png?height=400&width=600"
                width={600}
                height={400}
                alt="Documix interface"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<LinkIcon className="h-6 w-6" />}
              title="1. Load Documentation"
              description="Enter a URL or upload files (PDF, TXT, MD) to load your documentation."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="2. Process Content"
              description="Documix automatically processes your content for AI interaction."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="3. Chat & Get Answers"
              description="Ask questions about your documentation and get accurate responses."
            />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              See Documix in Action
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                <h3 className="font-medium">Documentation Chat</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-2 mt-1">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-sm">
                    How do I create a agent workflow with Langchain?
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mt-1">
                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-sm">
                    To create an agent workflow with LangChain, you define an
                    Agent class with methods for each step of the workflow. Use
                    SyncRunner or AsyncRunner to execute the workflow, passing
                    in initial context. The agent handles sequential tasks,
                    manages state between steps, and integrates with external
                    services as needed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to try Documix?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Start chatting with your documentation today.
            </p>
            <Link href="/home">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                &copy; {new Date().getFullYear()} Documix. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="bg-white dark:bg-slate-800 p-3 rounded-full w-fit mb-4">
        <div className="text-blue-600 dark:text-blue-400">{icon}</div>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 text-sm">
        {description}
      </p>
    </div>
  );
}
