import React from 'react';
import { IntelligentAdPlacement } from '@/components/IntelligentAdPlacement';

// Mock data for demonstration
const mockRepository = {
  id: 'repo_demo_001',
  fullName: 'user/awesome-react-project',
  description: 'A modern React application with TypeScript and advanced features',
  stars: 1250,
  language: 'TypeScript',
  isMonetized: true,
  adPlacementEnabled: true
};

const mockReadmeContent = `# Awesome React Project

A modern, feature-rich React application built with TypeScript, featuring state-of-the-art development practices and cutting-edge libraries.

## Features

- ⚡ **Fast Development**: Built with Vite for lightning-fast development experience
- 🎯 **TypeScript**: Full TypeScript support for better developer experience
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS
- 🔒 **Type Safe**: Comprehensive TypeScript coverage
- 📱 **Responsive**: Mobile-first responsive design
- ⚡ **Performance**: Optimized for speed and efficiency

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **State Management**: Zustand
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

Make sure you have Node.js 18+ and npm installed on your machine.

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/user/awesome-react-project.git
cd awesome-react-project
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── pages/         # Application pages
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── styles/        # Global styles and themes
\`\`\`

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`npm run lint\` - Run ESLint
- \`npm run type-check\` - Run TypeScript compiler

## Testing

This project uses Jest and React Testing Library for testing. Run tests with:

\`\`\`bash
npm run test
\`\`\`

For coverage reports:

\`\`\`bash
npm run test:coverage
\`\`\`

## Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

### Netlify

1. Build the project: \`npm run build\`
2. Upload the \`dist\` folder to Netlify

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## Performance

This application is optimized for performance:

- Code splitting for optimal loading
- Image optimization
- Bundle size analysis
- Core Web Vitals optimization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React team for the amazing framework
- Vercel for the excellent tooling
- The open source community for inspiration

## Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting issues
- 💡 Suggesting new features
- 🤝 Contributing to the project

For support, email support@example.com or join our [Discord community](https://discord.gg/example).
`;

export default function IntelligentAdsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Intelligent Ad Placement System
        </h1>
        <p className="text-lg text-gray-600">
          Experience our ML-powered ad placement technology that analyzes repository content 
          to generate contextually relevant, non-intrusive ad placements with A/B testing capabilities.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold text-lg">1</span>
            </div>
            <h3 className="font-medium mb-2">Content Analysis</h3>
            <p className="text-sm text-gray-600">
              AI analyzes README content to detect technologies, topics, and optimal placement positions
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold text-lg">2</span>
            </div>
            <h3 className="font-medium mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600">
              Contextual ad matching based on technology stack, audience, and content themes
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold text-lg">3</span>
            </div>
            <h3 className="font-medium mb-2">A/B Testing</h3>
            <p className="text-sm text-gray-600">
              Continuous optimization through statistical A/B testing of placement strategies
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-green-700 mb-2">🧠 ML-Powered Analysis</h3>
            <p className="text-sm text-gray-600">
              Advanced NLP and machine learning algorithms analyze content structure, sentiment, and complexity
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-blue-700 mb-2">🎯 Contextual Targeting</h3>
            <p className="text-sm text-gray-600">
              Smart ad matching based on detected technologies, topics, and target audience
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-purple-700 mb-2">📊 A/B Testing</h3>
            <p className="text-sm text-gray-600">
              Statistical significance testing with automatic optimization and early termination
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-orange-700 mb-2">🔄 Non-Intrusive</h3>
            <p className="text-sm text-gray-600">
              Carefully placed ads that blend naturally with content without disrupting user experience
            </p>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
        <p className="text-gray-600 mb-6">
          Try our intelligent ad placement system with this sample React/TypeScript repository. 
          The system will analyze the content and suggest optimal ad placements.
        </p>
        
        <IntelligentAdPlacement 
          repository={mockRepository} 
          readmeContent={mockReadmeContent} 
        />
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Implementation</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Content Analysis Engine</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Natural Language Processing for sentiment and complexity analysis</li>
              <li>Technology stack detection using keyword matching and pattern recognition</li>
              <li>Topic classification using semantic analysis</li>
              <li>Markdown structure parsing for optimal placement identification</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Ad Placement Algorithm</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Multi-factor scoring combining content relevance and placement quality</li>
              <li>Technology alignment scoring for precise targeting</li>
              <li>Position optimization to avoid code blocks and maintain readability</li>
              <li>Format selection based on repository characteristics</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">A/B Testing Framework</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Statistical significance testing using z-tests for conversion rates</li>
              <li>Deterministic traffic splitting for consistent user experience</li>
              <li>Early termination detection for significant results</li>
              <li>Effect size calculation for practical significance assessment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 