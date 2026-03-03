import { test, expect } from '@playwright/test';

test.describe('AI Package Assistant', () => {
    const projectId = '69a5c0a7580f06428fbd513f'; // Using the found project ID

    test.beforeEach(async ({ page }) => {
        // Navigate to the package selection page for the project
        await page.goto(`/projects/${projectId}/packages`);
        // Ensure the component is loaded
        await expect(page.getByText('AI Package Assistant')).toBeVisible();
    });

    test('should render the AI Package Assistant component', async ({ page }) => {
        const assistantHeading = page.getByRole('heading', { name: 'AI Package Assistant' });
        await expect(assistantHeading).toBeVisible();
        await expect(page.getByTestId('ai-tab-upload')).toBeVisible();
        await expect(page.getByTestId('ai-tab-chat')).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
        const chatTab = page.getByTestId('ai-tab-chat');
        const uploadTab = page.getByTestId('ai-tab-upload');

        // Switch to Chat tab
        await chatTab.click();
        await expect(page.getByPlaceholder(/Describe your customer's requirements/)).toBeVisible();

        // Switch back to Upload tab
        await uploadTab.click();
        await expect(page.getByText('Drop files here or click to browse')).toBeVisible();
    });

    test('should validate minimum character length for chat requirements', async ({ page }) => {
        await page.getByTestId('ai-tab-chat').click();

        const textarea = page.getByPlaceholder(/Describe your customer's requirements/);
        const analyzeButton = page.getByRole('button', { name: 'Analyze & Recommend' });

        // button should be disabled for short text
        await textarea.fill('Too short');
        await expect(analyzeButton).toBeDisabled();

        // button should be enabled for long text
        await textarea.fill('Needs a fully managed SD-WAN solution with security and cloud integration for a large retail chain.');
        await expect(analyzeButton).toBeEnabled();
    });

    test('should display recommendation when analysis is successful', async ({ page }) => {
        // Mock the API response with a small delay
        await page.route('/api/packages/recommend', async route => {
            await new Promise(resolve => setTimeout(resolve, 800));
            const json = {
                packageId: '69a60505da5a8553175cca02',
                reasoning: 'Based on your requirements for a highly secure and scalable network, the Premium package is the best fit.',
                confidence: 95,
                matchedRequirements: ['Managed SD-WAN', 'Cloud Security']
            };
            await route.fulfill({ json });
        });

        await page.getByTestId('ai-tab-chat').click();
        await page.getByPlaceholder(/Describe your customer's requirements/)
            .fill('Needs a fully managed SD-WAN solution with security and cloud integration for a large retail chain.');

        await page.getByRole('button', { name: 'Analyze & Recommend' }).click();

        // Check for "Analyzing..." state
        await expect(page.getByText('Analyzing...')).toBeVisible();

        // Wait for the recommendation header to appear
        await expect(page.getByTestId('ai-recommendation-header')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('95% confidence')).toBeVisible();
        await expect(page.getByText(/the Premium package is the best fit/)).toBeVisible();
    });

    test('should handle document uploads', async ({ page }) => {
        const fileName = 'test_requirements.txt';
        const fileContent = 'This is a test requirement document focusing on SD-WAN and Managed Services.';

        // Directly set files on the hidden input
        await page.setInputFiles('#ai-file-input', [{
            name: fileName,
            mimeType: 'text/plain',
            buffer: Buffer.from(fileContent)
        }]);

        // Verify file is listed
        await expect(page.getByText(fileName)).toBeVisible();

        // Button should be enabled
        const analyzeButton = page.getByRole('button', { name: 'Analyze & Recommend' });
        await expect(analyzeButton).toBeEnabled();

        // Clean up: remove file using test-id
        await page.getByTestId(`remove-file-${fileName}`).click();
        await expect(page.getByText(fileName)).not.toBeVisible();
    });
});
