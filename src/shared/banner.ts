import gradient from 'gradient-string';

/**
 * Configuration for banner styling
 */
interface BannerConfig {
  /** Enable gradient styling */
  gradient?: boolean;
  /** Custom gradient colors (default: blue to purple) */
  gradientColors?: string[];
  /** Minimum terminal width to display banner (default: 80) */
  minWidth?: number;
}

/**
 * Default banner configuration
 */
const DEFAULT_CONFIG: BannerConfig = {
  gradient: false,
  gradientColors: ['#0066ff', '#8b5cf6'],
  minWidth: 60, // Reduced minimum width for compact ASCII art
};

/**
 * Get banner configuration from environment variables and config
 */
function getBannerConfig(): BannerConfig {
  const config = { ...DEFAULT_CONFIG };

  // Check for gradient styling via environment variable
  const bannerStyle = process.env.BANNER_STYLE;
  if (bannerStyle === 'gradient' || bannerStyle === 'color') {
    config.gradient = true;
  }

  // Check for custom gradient colors
  const gradientColors = process.env.BANNER_GRADIENT_COLORS;
  if (gradientColors) {
    try {
      config.gradientColors = gradientColors.split(',').map((c) => c.trim());
    } catch {
      // Invalid gradient colors, use default
    }
  }

  return config;
}

/**
 * Generate compact ASCII art banner text
 */
function generateAsciiArt(text: string): string {
  // Simple compact ASCII art for "Open Router CLI"
  if (text === 'Open Router CLI') {
    return `
  ___                     ___             _                ___  _     ___ 
 / _ \\  _ __  ___  _ _   | _ \\ ___  _  _ | |_  ___  _ _   / __|| |   |_ _|
| (_) || '_ \\/ -_)| ' \\  |   // _ \\| || ||  _|/ -_)| '_| | (__ | |__  | | 
 \\___/ | .__/\\___||_||_| |_|_\\\\___/ \\_,_| \\__|\\___||_|    \\___||____||___|
       |_|                                                                
`;
  }

  // Fallback for other text
  return text;
}

/**
 * Center text based on terminal width
 */
function centerText(text: string, terminalWidth: number): string {
  const lines = text.split('\n');
  const centeredLines = lines.map((line) => {
    const lineLength = line.length;
    if (lineLength >= terminalWidth) {
      return line; // Don't center if line is too long
    }

    const padding = Math.max(0, Math.floor((terminalWidth - lineLength) / 2));
    return ' '.repeat(padding) + line;
  });

  return centeredLines.join('\n');
}

/**
 * Apply gradient styling to text if enabled
 */
function applyStyling(text: string, config: BannerConfig): string {
  if (!config.gradient) {
    return text;
  }

  try {
    const gradientFn = gradient(config.gradientColors!);
    return gradientFn(text);
  } catch {
    // If gradient fails, return plain text
    return text;
  }
}

/**
 * Print the OpenRouter CLI banner
 */
export function printBanner(): void {
  // Only show banner in TTY environments
  if (!process.stdout.isTTY) {
    return;
  }

  const config = getBannerConfig();
  const terminalWidth = process.stdout.columns || 80;

  // Check if terminal is wide enough
  if (terminalWidth < config.minWidth!) {
    // Terminal too narrow, show simple text
    console.log('Open Router CLI');
    return;
  }

  try {
    // Generate ASCII art
    const asciiArt = generateAsciiArt('Open Router CLI');

    // Center the text
    const centeredArt = centerText(asciiArt, terminalWidth);

    // Apply styling
    const styledArt = applyStyling(centeredArt, config);

    // Print the banner

    console.log(styledArt);
  } catch (error) {
    // Fallback to simple text if anything fails
    console.error(error);
    console.log('Open Router CLI');
  }
}
