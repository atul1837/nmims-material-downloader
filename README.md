# NMIMS PDF/PPT Downloader

A Chrome extension that automatically detects and downloads PDF and PowerPoint files from the NMIMS Student Portal.

## 🚀 Quick Installation (Recommended)

**For most users, this is the easiest way to install the extension:**

1. **Download the pre-built extension**:
   - Go to the [Releases](https://github.com/atul1837/nmims-material-downloader/releases) page
   - Download the latest `dist.zip` file

2. **Extract the zip file**:
   - Extract the downloaded `dist.zip` file to any folder on your computer
   - You'll get a `dist` folder containing the extension files

3. **Install in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the extracted `dist` folder
   - The extension will be installed and ready to use!

## Features

- **Automatic Detection**: Monitors network requests and iframes for PDF/PPT files
- **Floating Download Button**: Shows a clean, non-intrusive download button in the bottom-left corner when files are detected
- **One-Click Download**: Download detected files with a single click
- **Domain Restricted**: Only works on the NMIMS Student Portal for security and privacy
- **File Type Support**: Supports PDF, PPT, and PPTX files

## Usage

1. Navigate to the NMIMS Student Portal: `https://studentzone-ncdoe.nmims.edu/studentportalapp/courseDetails`
2. Open any course content that contains PDF or PowerPoint files
3. When a file is detected, a download button will appear in the bottom-left corner
4. Click the "Download" button to save the file to your computer

## How It Works

The extension uses three main components:

1. **Background Script**: Monitors network requests to CloudFront URLs for PDF/PPT files
2. **Content Script**: Displays the download UI and handles user interactions
3. **Manifest**: Defines permissions and restricts the extension to NMIMS domains only

## Permissions

The extension requires the following permissions:
- `activeTab`: To interact with the current tab
- `storage`: To store extension data
- `downloads`: To download files
- `webRequest`: To monitor network requests for file detection

## Security

- The extension only works on NMIMS Student Portal domains
- Network monitoring is restricted to CloudFront URLs used by NMIMS
- No data is collected or transmitted to external servers

## 🔧 Development Installation

**For developers who want to build from source:**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/atul1837/nmims-material-downloader.git
   cd nmims-material-downloader
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the extension**:
   ```bash
   pnpm build
   ```

4. **Load the extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

## 🔄 Development Workflow

To modify the extension:

1. Make changes to the source files in the `src` directory
2. Run `pnpm build` to rebuild
3. Reload the extension in Chrome extensions page

## File Structure

- `src/manifest.ts` - Extension configuration
- `src/background/index.ts` - Background script for network monitoring
- `src/content/Content.tsx` - React component for the download UI
- `src/content/index.*.tsx` - Content script entry points