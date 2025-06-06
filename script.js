// AI Task Creator - JavaScript
class TaskCreator {
    constructor() {
        this.currentStep = 1;
        this.modelResponses = [];
        this.rubricCriteria = [];
        this.evaluations = {};
        this.metricScores = {}; // Store scores for each metric
        this.taskData = {
            promptText: '',
            constraints: [],
            responses: [],
            rubric: [],
            evaluations: {},
            commonEvaluation: ''
        };
        
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadDraft();
        this.initializeResponseTabs();
        this.initializeSidebar();
    }

    attachEventListeners() {
        // Step navigation
        document.getElementById('next-step-1')?.addEventListener('click', () => this.generateModelResponses());
        document.getElementById('prev-step-2')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('next-step-2')?.addEventListener('click', () => this.goToStep(3));
        document.getElementById('prev-step-3')?.addEventListener('click', () => this.goToStep(2));

        // Prompt generator (inline)
        document.getElementById('generate-prompt-btn')?.addEventListener('click', () => this.generatePromptFromTemplate());
        document.getElementById('clear-generator')?.addEventListener('click', () => this.clearGeneratorSelections());


        // Rubric tools
        document.getElementById('generate-rubric')?.addEventListener('click', () => this.generateRubric());
        document.getElementById('add-criterion')?.addEventListener('click', () => this.addCriterion());

        // Other actions
        document.getElementById('regenerate-responses')?.addEventListener('click', () => this.regenerateResponses());
        document.getElementById('save-draft')?.addEventListener('click', () => this.saveDraft());
        document.getElementById('submit-task')?.addEventListener('click', () => this.submitTask());

        // Auto-save on input changes
        document.getElementById('prompt-text')?.addEventListener('input', () => this.autoSave());
        document.getElementById('common-evaluation')?.addEventListener('input', () => this.saveCommonEvaluation());
        document.querySelectorAll('input[name="constraints"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.autoSave());
        });

        // Generator form changes
        ['domain-category', 'task-type', 'complexity-level', 'requirements-count'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.autoSave());
        });

        // Response tabs
        document.querySelectorAll('.response-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchResponseTab(e.target.dataset.response));
        });

        // Evaluation tabs
        document.querySelectorAll('.eval-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchEvalTab(e.target.dataset.response));
        });

        // Close notification
        document.getElementById('notification-close')?.addEventListener('click', () => this.hideNotification());

        // Metric header clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.metric-header')) {
                const metricItem = e.target.closest('.metric-item');
                this.toggleMetricVisibility(metricItem);
            }
        });

        // Clickable criteria clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clickable')) {
                this.handleCriterionClick(e.target);
            }
        });
    }

    saveCommonEvaluation() {
        const commonEvaluation = document.getElementById('common-evaluation')?.value || '';
        this.taskData.commonEvaluation = commonEvaluation;
        this.autoSave();
    }

    // Clear generator selections
    clearGeneratorSelections() {
        ['domain-category', 'task-type', 'complexity-level', 'requirements-count'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        // Clear all constraints
        document.querySelectorAll('input[name="constraints"]:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.showNotification('Generator selections cleared', 'info');
        this.autoSave();
    }

    // Navigation functions
    navigateToStep(step) {
        // Save current step data
        this.saveCurrentStepData();
        
        // Check if step is accessible
        if (step > this.currentStep + 1) {
            this.showNotification('Complete the current step first', 'warning');
            return;
        }
        
        this.goToStep(step);
    }

    goToStep(step) {
        // Save current step data before switching
        this.saveCurrentStepData();
        
        // Hide current step
        document.querySelector(`#step-${this.currentStep}`)?.classList.remove('active');

        // Show new step with proper layout reset
        this.currentStep = step;
        const newStepElement = document.querySelector(`#step-${step}`);
        if (newStepElement) {
            newStepElement.classList.add('active');
            
            // Ensure proper layout
            setTimeout(() => {
                newStepElement.style.width = '100%';
                newStepElement.style.maxWidth = '100%';
            }, 50);
        }

        this.updateSidebarState();
        
        // Load step-specific data
        this.loadStepData(step);
        
        // Scroll to top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
    }

    saveCurrentStepData() {
        switch (this.currentStep) {
            case 1:
                this.taskData.promptText = document.getElementById('prompt-text')?.innerHTML || '';
                this.taskData.constraints = Array.from(document.querySelectorAll('input[name="constraints"]:checked'))
                    .map(cb => cb.value);
                
                // Save generator selections
                this.taskData.generatorData = {
                    domainCategory: document.getElementById('domain-category')?.value || '',
                    taskType: document.getElementById('task-type')?.value || '',
                    complexityLevel: document.getElementById('complexity-level')?.value || '',
                    requirementsCount: document.getElementById('requirements-count')?.value || ''
                };
                break;
            case 2:
                // Save common evaluation
                this.taskData.commonEvaluation = document.getElementById('common-evaluation')?.value || '';
                break;
            case 3:
                // Evaluation data is saved in real-time
                break;
        }
        
        // Auto-save to localStorage
        this.saveDraft();
    }

    loadStepData(step) {
        switch (step) {
            case 1:
                if (this.taskData.promptText) {
                    document.getElementById('prompt-text').innerHTML = this.taskData.promptText;
                }
                this.taskData.constraints.forEach(constraint => {
                    const checkbox = document.querySelector(`input[value="${constraint}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Load generator data
                if (this.taskData.generatorData) {
                    const data = this.taskData.generatorData;
                    if (data.domainCategory) document.getElementById('domain-category').value = data.domainCategory;
                    if (data.taskType) document.getElementById('task-type').value = data.taskType;
                    if (data.complexityLevel) document.getElementById('complexity-level').value = data.complexityLevel;
                    if (data.requirementsCount) document.getElementById('requirements-count').value = data.requirementsCount;
                }
                break;
            case 2:
                // Load common evaluation
                if (this.taskData.commonEvaluation) {
                    const textarea = document.getElementById('common-evaluation');
                    if (textarea) {
                        textarea.value = this.taskData.commonEvaluation;
                    }
                }
                this.loadRubricCriteria();
                break;
            case 3:
                this.loadEvaluationData();
                break;
        }
    }

    initializeSidebar() {
        // Initialize sidebar navigation state
        this.updateSidebarState();
        this.updateMetricScores();
        
        // Hide all metric criteria by default
        document.querySelectorAll('.metric-criteria').forEach(criteria => {
            criteria.style.display = 'none';
        });
    }

    updateSidebarState() {
        // Update active nav step
        document.querySelectorAll('.nav-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector(`.nav-step[data-step="${this.currentStep}"]`)?.classList.add('active');
        
        // Update content visibility
        for (let i = 1; i <= 3; i++) {
            const content = document.getElementById(`nav-content-${i}`);
            
            if (i === this.currentStep) {
                // Show current step content
                if (content) content.style.display = 'block';
            } else {
                // Hide other step content
                if (content) content.style.display = 'none';
            }
        }
    }

    updateMetricScores() {
        // Calculate scores for each step based on evaluated metrics
        for (let step = 1; step <= 3; step++) {
            const scoreElement = document.getElementById(`nav-score-${step}`);
            if (scoreElement) {
                if (step === this.currentStep) {
                    // Show current step scores if any
                    const stepMetrics = this.getMetricsForStep(step);
                    const completedMetrics = stepMetrics.filter(metric => this.metricScores[metric] !== undefined);
                    
                    if (completedMetrics.length === 0) {
                        scoreElement.textContent = 'Active';
                        scoreElement.style.color = 'var(--primary)';
                    } else {
                        const avgScore = Math.round(
                            completedMetrics.reduce((sum, metric) => sum + this.metricScores[metric], 0) / completedMetrics.length
                        );
                        scoreElement.textContent = `${avgScore}%`;
                        scoreElement.style.color = this.getScoreColor(avgScore);
                    }
                } else if (step < this.currentStep) {
                    // Calculate completed step scores
                    const stepMetrics = this.getMetricsForStep(step);
                    const completedMetrics = stepMetrics.filter(metric => this.metricScores[metric] !== undefined);
                    
                    if (completedMetrics.length === 0) {
                        scoreElement.textContent = '-';
                        scoreElement.style.color = 'var(--text-muted)';
                    } else {
                        const avgScore = Math.round(
                            completedMetrics.reduce((sum, metric) => sum + this.metricScores[metric], 0) / completedMetrics.length
                        );
                        scoreElement.textContent = `${avgScore}%`;
                        scoreElement.style.color = this.getScoreColor(avgScore);
                    }
                } else {
                    scoreElement.textContent = '-';
                    scoreElement.style.color = 'var(--text-muted)';
                }
            }
        }
    }
    
    getMetricsForStep(step) {
        const stepMetrics = {
            1: ['clarity', 'appropriateness', 'originality', 'objectivity', 'complexity', 'context'],
            2: ['rubric-agreement', 'rubric-formatting', 'objective-scoring'],
            3: ['grading-completeness', 'target-difficulty']
        };
        return stepMetrics[step] || [];
    }

    toggleNavStep(step) {
        const content = document.getElementById(`nav-content-${step}`);
        
        if (step === this.currentStep) {
            // Current step - just toggle content visibility
            if (content.style.display === 'none') {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        } else {
            // Different step - navigate to it
            this.navigateToStep(step);
        }
    }

    // Response tabs functionality
    initializeResponseTabs() {
        // Show first tab by default
        this.switchResponseTab('1');
    }

    switchResponseTab(responseNumber) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.response-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.response-content-item').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`.response-tab[data-response="${responseNumber}"]`)?.classList.add('active');
        document.querySelector(`#response-content-${responseNumber}`)?.classList.add('active');
    }

    // Model response generation
    async generateModelResponses() {
        const promptText = document.getElementById('prompt-text')?.innerHTML?.trim();
        
        if (!promptText || promptText.length < 50) {
            this.showNotification('Please write a prompt with at least 50 characters', 'error');
            return;
        }

        this.saveCurrentStepData();
        this.goToStep(2);

        // Generate 4 different responses
        const responsePromises = [];
        for (let i = 1; i <= 4; i++) {
            responsePromises.push(this.generateSingleModelResponse(i, promptText));
        }

        try {
            await Promise.all(responsePromises);
            this.showNotification('Model responses generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating responses:', error);
            this.showNotification('Error generating responses. Please try again.', 'error');
        }
    }

    async generateSingleModelResponse(responseNumber, prompt) {
        const responseElement = document.getElementById(`response-${responseNumber}`);
        
        // Show loading state
        responseElement.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Generating response ${responseNumber}...
            </div>
        `;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Generate simulated response
        const responses = this.getSimulatedResponses(prompt);
        const response = responses[responseNumber - 1] || responses[0];
        
        responseElement.innerHTML = `<div class="response-text">${response}</div>`;
        
        // Store response
        this.taskData.responses[responseNumber - 1] = response;
        this.modelResponses[responseNumber - 1] = response;

        return response;
    }

    getSimulatedResponses(prompt) {
        const responses = [
            `Based on the given prompt, here is a comprehensive response that addresses the key requirements. The analysis shows multiple perspectives and considerations that need to be taken into account. First, we should examine the fundamental assumptions underlying the question. Then, we can explore various approaches and their implications. The evidence suggests that a balanced approach would be most effective, considering both short-term and long-term consequences.`,
            
            `To address this prompt effectively, I'll break down the response into several key components. Initially, it's important to establish the context and scope of the discussion. The main factors to consider include practical implications, theoretical frameworks, and real-world applications. Based on current research and best practices, I recommend a multi-faceted approach that incorporates diverse viewpoints while maintaining focus on the core objectives.`,
            
            `This is an interesting prompt that requires careful consideration of multiple variables. From my analysis, there are several critical points to address: methodology, implementation strategies, and potential outcomes. The response should be structured to first identify the primary challenges, then propose solutions, and finally evaluate the expected results. Drawing from established principles and contemporary examples, here's my assessment of the situation.`,
            
            `In responding to this prompt, I want to emphasize the importance of systematic thinking and evidence-based reasoning. The complexity of the topic requires us to examine various dimensions including technical aspects, practical considerations, and broader implications. My approach will be to present a logical progression of ideas, supported by relevant examples and clear reasoning. The goal is to provide actionable insights while acknowledging areas of uncertainty.`
        ];
        
        return responses.map(response => {
            return response + ` [Generated for: "${prompt.substring(0, 100)}..."]`;
        });
    }

    async regenerateResponses() {
        const promptText = document.getElementById('prompt-text')?.innerHTML?.trim();
        if (!promptText) {
            this.showNotification('No prompt available to regenerate responses', 'error');
            return;
        }

        const responsePromises = [];
        for (let i = 1; i <= 4; i++) {
            responsePromises.push(this.generateSingleModelResponse(i, promptText));
        }

        try {
            await Promise.all(responsePromises);
            this.showNotification('Responses regenerated successfully!', 'success');
        } catch (error) {
            console.error('Error regenerating responses:', error);
            this.showNotification('Error regenerating responses. Please try again.', 'error');
        }
    }

    // Prompt Generator (inline version)
    generatePromptFromTemplate() {
        const domainCategory = document.getElementById('domain-category')?.value;
        const taskType = document.getElementById('task-type')?.value;
        const complexity = document.getElementById('complexity-level')?.value;
        const requirementsCount = parseInt(document.getElementById('requirements-count')?.value) || 3;

        if (!domainCategory || !taskType) {
            this.showNotification('Please select domain category and task type', 'error');
            return;
        }

        const prompt = this.generatePromptTemplate(domainCategory, taskType, complexity, requirementsCount);
        document.getElementById('prompt-text').innerHTML = prompt;
        
        this.taskData.promptText = prompt;
        this.autoSave();
        
        // Auto-scroll to the prompt editor after generation
        const promptEditor = document.querySelector('.prompt-editor-section');
        if (promptEditor) {
            promptEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.showNotification('Prompt generated successfully!', 'success');
    }

    generatePromptTemplate(domain, type, complexity, requirements) {
        const templates = {
            planning: {
                planning: `Plan a comprehensive corporate team-building event for 50 employees with a budget of $10,000. Your plan must include:

<strong>Requirements:</strong>
${this.generateRequirements(requirements, [
    "Detailed venue selection with justification",
    "Complete activity schedule with timing",
    "Catering options that accommodate dietary restrictions",
    "Transportation arrangements for all participants", 
    "Risk management and contingency plans",
    "Budget breakdown with cost per category",
    "Team dynamics assessment",
    "Success metrics and evaluation criteria"
])}

<strong>Constraints:</strong>
- The event must be completed within 8 hours
- All activities must be suitable for people with different fitness levels
- Provide at least 3 alternative backup plans for weather issues
- Must comply with corporate safety regulations`,
                
                analysis: `Analyze the quarterly sales performance data for a retail company and create a comprehensive improvement strategy. Your analysis must include:

<strong>Requirements:</strong>
${this.generateRequirements(requirements, [
    "Statistical analysis of sales trends by product category",
    "Identification of top 3 underperforming areas with root cause analysis",
    "Competitor analysis with market positioning insights",
    "Customer segment analysis with purchasing patterns",
    "ROI calculations for proposed improvement initiatives",
    "Implementation timeline with specific milestones",
    "Risk assessment for proposed changes",
    "Success metrics and KPIs"
])}

<strong>Data to analyze:</strong>
- Q1: $2.3M total sales, 15% growth
- Q2: $1.8M total sales, -8% decline
- Q3: $2.1M total sales, 12% recovery`
            },
            
            calculation: {
                calculation: `Calculate the optimal investment portfolio allocation for a client with $500,000 to invest. Your calculation must include:

<strong>Requirements:</strong>
${this.generateRequirements(requirements, [
    "Risk assessment based on client profile (age 45, moderate risk tolerance)",
    "Diversification across at least 5 asset classes",
    "Expected return calculations with probability distributions",
    "Tax optimization strategies for different account types",
    "Rebalancing schedule with trigger points",
    "Performance benchmarking against market indices",
    "Stress testing under different market scenarios",
    "Detailed cost analysis including fees"
])}

<strong>Constraints:</strong>
- Maximum single stock allocation: 5%
- Minimum emergency fund: 6 months expenses ($30,000)
- Investment horizon: 20 years until retirement`,

                creative: `Design a comprehensive marketing campaign for a new sustainable fashion brand launching in 2024. Your campaign must include:

<strong>Requirements:</strong>
${this.generateRequirements(requirements, [
    "Brand positioning and unique value proposition",
    "Multi-channel marketing strategy with budget allocation",
    "Content calendar for 6 months with specific deliverables",
    "Influencer partnership strategy with selection criteria",
    "Sustainability messaging framework",
    "Performance metrics and measurement strategy",
    "Crisis communication plan",
    "Launch event concept and execution plan"
])}

<strong>Constraints:</strong>
- Total budget: $250,000
- Campaign duration: 6 months
- Must align with sustainability values
- Comply with advertising standards`
            }
        };

        const template = templates[domain]?.[type];
        if (template) {
            return template;
        }

        // Generic template fallback
        return `Create a detailed ${type} for ${domain} domain with ${complexity} complexity level.

<strong>Requirements:</strong>
${this.generateRequirements(requirements, [
    "Thorough analysis of the problem scope",
    "Multiple solution approaches with pros and cons",
    "Implementation strategy with clear steps",
    "Risk assessment and mitigation plans",
    "Success metrics and evaluation criteria",
    "Timeline with specific deliverables",
    "Resource requirements and constraints",
    "Quality assurance measures"
])}

Please provide a comprehensive response that addresses all requirements systematically.`;
    }

    generateRequirements(count, options) {
        const selected = options.slice(0, count);
        return selected.map((req, index) => `${index + 1}. ${req}`).join('\n');
    }

    // Rich text editor functions
    formatText(command) {
        document.execCommand(command, false, null);
        document.getElementById('prompt-text').focus();
    }

    // Rubric functions
    generateRubric() {
        const commonEvaluation = document.getElementById('common-evaluation')?.value?.trim();
        const promptText = document.getElementById('prompt-text')?.innerHTML?.trim();
        
        if (!commonEvaluation) {
            this.showNotification('Please write error analysis first', 'error');
            return;
        }

        // Generate criteria based on common evaluation and prompt analysis
        const generatedCriteria = this.analyzeErrorsForCriteria(commonEvaluation, promptText);
        
        // Clear existing criteria
        this.rubricCriteria = [];
        document.getElementById('rubric-criteria').innerHTML = '';
        
        // Add generated criteria
        generatedCriteria.forEach(criterion => {
            this.addCriterion(criterion.title, criterion.requirements);
        });

        // Show rubric section
        document.getElementById('rubric-section').style.display = 'block';

        this.showNotification('Rubric generated based on error analysis!', 'success');
    }

    analyzeErrorsForCriteria(errorAnalysis, prompt) {
        // Analyze common evaluation for patterns
        const criteria = [];
        const lowerErrors = errorAnalysis.toLowerCase();
        
        if (lowerErrors.includes('structure') || lowerErrors.includes('organization') || lowerErrors.includes('flow')) {
            criteria.push({
                title: 'Structure and Organization',
                requirements: [
                    { text: 'Clear logical structure', points: 2 },
                    { text: 'Smooth transitions between sections', points: 2 },
                    { text: 'Proper introduction and conclusion', points: 1 }
                ]
            });
        }
        
        if (lowerErrors.includes('requirement') || lowerErrors.includes('missing') || lowerErrors.includes('incomplete')) {
            criteria.push({
                title: 'Requirement Completeness',
                requirements: [
                    { text: 'All prompt requirements addressed', points: 3 },
                    { text: 'Sufficient detail provided', points: 2 },
                    { text: 'No critical gaps or omissions', points: 1 }
                ]
            });
        }
        
        if (lowerErrors.includes('accuracy') || lowerErrors.includes('error') || lowerErrors.includes('incorrect')) {
            criteria.push({
                title: 'Accuracy and Correctness',
                requirements: [
                    { text: 'Factually accurate information', points: 3 },
                    { text: 'Correct calculations or analysis', points: 2 },
                    { text: 'No misleading statements', points: 1 }
                ]
            });
        }

        if (lowerErrors.includes('clarity') || lowerErrors.includes('confusing') || lowerErrors.includes('unclear')) {
            criteria.push({
                title: 'Clarity and Communication',
                requirements: [
                    { text: 'Clear and understandable language', points: 2 },
                    { text: 'Well-defined terms and concepts', points: 2 },
                    { text: 'Effective use of examples', points: 1 }
                ]
            });
        }

        if (lowerErrors.includes('format') || lowerErrors.includes('style') || lowerErrors.includes('presentation')) {
            criteria.push({
                title: 'Format and Presentation',
                requirements: [
                    { text: 'Follows required format guidelines', points: 2 },
                    { text: 'Professional presentation', points: 1 },
                    { text: 'Proper formatting and styling', points: 1 }
                ]
            });
        }
        
        // Default criteria if no specific patterns found
        if (criteria.length === 0) {
            criteria.push({
                title: 'Overall Quality',
                requirements: [
                    { text: 'Addresses prompt requirements', points: 3 },
                    { text: 'Demonstrates clear reasoning', points: 2 },
                    { text: 'Shows attention to detail', points: 1 }
                ]
            });
        }
        
        return criteria;
    }

    addCriterion(title = '', requirements = []) {
        const criterionId = Date.now();
        const criterion = {
            id: criterionId,
            title: title || 'New Criterion',
            requirements: requirements.length > 0 ? requirements : [
                { text: '', points: 1 }
            ]
        };
        
        this.rubricCriteria.push(criterion);
        this.renderCriterion(criterion);
        this.updateRubricSummary();
    }

    renderCriterion(criterion) {
        const container = document.getElementById('rubric-criteria');
        const criterionHtml = `
            <div class="criterion-item" data-criterion-id="${criterion.id}">
                <div class="criterion-header">
                    <input type="text" class="criterion-title" value="${criterion.title}" placeholder="Criterion title">
                    <div class="criterion-actions">
                        <button type="button" class="btn btn-secondary" onclick="taskCreator.addRequirement(${criterion.id})">
                            <i class="fas fa-plus"></i> Add Requirement
                        </button>
                        <button type="button" class="btn btn-warning" onclick="taskCreator.removeCriterion(${criterion.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="criterion-requirements" id="requirements-${criterion.id}">
                    ${criterion.requirements.map((req, index) => this.renderRequirement(criterion.id, req, index)).join('')}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', criterionHtml);
        
        // Attach event listeners
        const criterionElement = container.lastElementChild;
        const titleInput = criterionElement.querySelector('.criterion-title');
        titleInput.addEventListener('input', (e) => {
            criterion.title = e.target.value;
            this.autoSave();
        });
    }

    renderRequirement(criterionId, requirement, index) {
        return `
            <div class="requirement-item">
                <input type="text" value="${requirement.text}" placeholder="Requirement description" 
                       onchange="taskCreator.updateRequirement(${criterionId}, ${index}, 'text', this.value)">
                <input type="number" min="1" max="5" value="${requirement.points}" 
                       onchange="taskCreator.updateRequirement(${criterionId}, ${index}, 'points', parseInt(this.value))">
                <button type="button" class="btn btn-warning" onclick="taskCreator.removeRequirement(${criterionId}, ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    addRequirement(criterionId) {
        const criterion = this.rubricCriteria.find(c => c.id === criterionId);
        if (criterion) {
            criterion.requirements.push({ text: '', points: 1 });
            this.refreshCriterion(criterion);
            this.updateRubricSummary();
        }
    }

    removeRequirement(criterionId, index) {
        const criterion = this.rubricCriteria.find(c => c.id === criterionId);
        if (criterion && criterion.requirements.length > 1) {
            criterion.requirements.splice(index, 1);
            this.refreshCriterion(criterion);
            this.updateRubricSummary();
        }
    }

    updateRequirement(criterionId, index, field, value) {
        const criterion = this.rubricCriteria.find(c => c.id === criterionId);
        if (criterion && criterion.requirements[index]) {
            criterion.requirements[index][field] = value;
            this.updateRubricSummary();
            this.autoSave();
        }
    }

    removeCriterion(criterionId) {
        this.rubricCriteria = this.rubricCriteria.filter(c => c.id !== criterionId);
        document.querySelector(`[data-criterion-id="${criterionId}"]`)?.remove();
        this.updateRubricSummary();
    }

    refreshCriterion(criterion) {
        const container = document.getElementById(`requirements-${criterion.id}`);
        container.innerHTML = criterion.requirements.map((req, index) => 
            this.renderRequirement(criterion.id, req, index)
        ).join('');
    }

    updateRubricSummary() {
        const totalCriteria = this.rubricCriteria.length;
        const totalRequirements = this.rubricCriteria.reduce((sum, c) => sum + c.requirements.length, 0);
        
        document.getElementById('total-criteria').textContent = totalCriteria;
        document.getElementById('total-requirements').textContent = totalRequirements;
    }

    loadRubricCriteria() {
        // Load saved rubric criteria if any
        if (this.taskData.rubric && this.taskData.rubric.length > 0) {
            this.rubricCriteria = this.taskData.rubric;
            const container = document.getElementById('rubric-criteria');
            container.innerHTML = '';
            
            this.rubricCriteria.forEach(criterion => {
                this.renderCriterion(criterion);
            });
            
            this.updateRubricSummary();
            document.getElementById('rubric-section').style.display = 'block';
        }
    }

    // Evaluation functions
    switchEvalTab(responseNumber) {
        // Remove active class from all tabs
        document.querySelectorAll('.eval-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.response-preview').forEach(preview => preview.style.display = 'none');
        
        // Add active class to selected tab
        document.querySelector(`.eval-tab[data-response="${responseNumber}"]`)?.classList.add('active');
        document.getElementById(`eval-response-${responseNumber}`).style.display = 'block';
        
        // Load response content
        const responseContent = this.modelResponses[responseNumber - 1] || 'No response available';
        document.getElementById(`eval-response-${responseNumber}`).innerHTML = responseContent;
        
        // Load evaluation form for this response
        this.loadEvaluationForm(responseNumber);
    }

    loadEvaluationForm(responseNumber) {
        const form = document.getElementById('evaluation-form');
        
        if (this.rubricCriteria.length === 0) {
            form.innerHTML = '<p>Please create rubric criteria first.</p>';
            return;
        }
        
        const formHtml = this.rubricCriteria.map(criterion => `
            <div class="criterion-evaluation">
                <h4>${criterion.title}</h4>
                <div class="requirements-evaluation">
                    ${criterion.requirements.map((req, reqIndex) => `
                        <div class="requirement-evaluation">
                            <input type="checkbox" 
                                   id="eval-${responseNumber}-${criterion.id}-${reqIndex}"
                                   onchange="taskCreator.updateEvaluation(${responseNumber}, ${criterion.id}, ${reqIndex}, this.checked)">
                            <span>${req.text} (${req.points} points)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        form.innerHTML = formHtml;
        
        // Load existing evaluations
        this.loadExistingEvaluations(responseNumber);
    }

    loadExistingEvaluations(responseNumber) {
        if (this.evaluations[responseNumber]) {
            Object.entries(this.evaluations[responseNumber]).forEach(([criterionId, requirements]) => {
                Object.entries(requirements).forEach(([reqIndex, checked]) => {
                    const checkbox = document.getElementById(`eval-${responseNumber}-${criterionId}-${reqIndex}`);
                    if (checkbox) checkbox.checked = checked;
                });
            });
        }
    }

    updateEvaluation(responseNumber, criterionId, reqIndex, checked) {
        if (!this.evaluations[responseNumber]) {
            this.evaluations[responseNumber] = {};
        }
        if (!this.evaluations[responseNumber][criterionId]) {
            this.evaluations[responseNumber][criterionId] = {};
        }
        
        this.evaluations[responseNumber][criterionId][reqIndex] = checked;
        
        // Calculate and update score
        this.updateScore(responseNumber);
        this.autoSave();
    }

    updateScore(responseNumber) {
        const evaluation = this.evaluations[responseNumber];
        if (!evaluation) return;
        
        let totalPoints = 0;
        let maxPoints = 0;
        
        this.rubricCriteria.forEach(criterion => {
            criterion.requirements.forEach((req, reqIndex) => {
                maxPoints += req.points;
                if (evaluation[criterion.id] && evaluation[criterion.id][reqIndex]) {
                    totalPoints += req.points;
                }
            });
        });
        
        const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
        
        // Update score badge
        const scoreBadge = document.getElementById(`score-${responseNumber}`);
        if (scoreBadge) {
            scoreBadge.textContent = `${percentage}%`;
        }
        
        // Update validation score
        const validationScore = document.getElementById(`validation-${responseNumber}`);
        if (validationScore) {
            validationScore.textContent = `${percentage}%`;
            validationScore.className = `validation-score ${percentage < 30 ? 'pass' : ''}`;
        }
        
        return percentage;
    }

    loadEvaluationData() {
        // Initialize first tab
        this.switchEvalTab('1');
        
        // Update all scores
        for (let i = 1; i <= 4; i++) {
            this.updateScore(i);
        }
    }

    // Data persistence
    autoSave() {
        this.taskData.promptText = document.getElementById('prompt-text')?.innerHTML || '';
        this.taskData.constraints = Array.from(document.querySelectorAll('input[name="constraints"]:checked'))
            .map(cb => cb.value);
        this.taskData.rubric = this.rubricCriteria;
        this.taskData.evaluations = this.evaluations;
        this.taskData.commonEvaluation = document.getElementById('common-evaluation')?.value || '';
        this.taskData.metricScores = this.metricScores;
        
        localStorage.setItem('ai-task-draft', JSON.stringify(this.taskData));
    }

    saveDraft() {
        this.autoSave();
        this.showNotification('Draft saved successfully!', 'success');
    }

    loadDraft() {
        const saved = localStorage.getItem('ai-task-draft');
        if (saved) {
            try {
                this.taskData = JSON.parse(saved);
                this.rubricCriteria = this.taskData.rubric || [];
                this.evaluations = this.taskData.evaluations || {};
                this.modelResponses = this.taskData.responses || [];
                this.metricScores = this.taskData.metricScores || {};
                
                // Restore metric selections and scores
                this.restoreMetricSelections();
                
                // Load data into current step
                this.loadStepData(this.currentStep);
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }
    
    restoreMetricSelections() {
        Object.keys(this.metricScores).forEach(metricName => {
            const metricItem = document.querySelector(`[data-metric="${metricName}"]`);
            if (metricItem) {
                const score = this.metricScores[metricName];
                
                // Find and select the appropriate criterion based on score
                const criteria = metricItem.querySelectorAll('.criterion.clickable');
                criteria.forEach(criterion => {
                    criterion.classList.remove('selected');
                    if (parseInt(criterion.dataset.score) === score) {
                        criterion.classList.add('selected');
                    }
                });
                
                // Update score display
                const scoreSpan = metricItem.querySelector('.metric-score');
                if (scoreSpan) {
                    scoreSpan.textContent = score;
                    scoreSpan.style.color = this.getScoreColor(score);
                }
                
                // Mark as evaluated and hide criteria
                metricItem.classList.add('evaluated');
                
                // Ensure criteria are hidden for evaluated metrics
                const metricCriteria = metricItem.querySelector('.metric-criteria');
                if (metricCriteria) {
                    metricCriteria.style.display = 'none';
                }
            }
        });
    }

    submitTask() {
        // Validate task completion
        const validationErrors = this.validateTask();
        
        if (validationErrors.length > 0) {
            this.showNotification(validationErrors[0], 'error');
            return;
        }
        
        // Check if all responses score below 30%
        const allScoresValid = this.checkScoreValidation();
        if (!allScoresValid) {
            this.showNotification('All responses must score below 30% to submit', 'warning');
            return;
        }
        
        // Submit task (in real implementation, this would send to server)
        this.showNotification('Task submitted successfully!', 'success');
        
        // Clear draft
        localStorage.removeItem('ai-task-draft');
        
        // Reset form
        setTimeout(() => {
            location.reload();
        }, 2000);
    }

    validateTask() {
        const errors = [];
        
        if (!this.taskData.promptText || this.taskData.promptText.trim().length < 50) {
            errors.push('Prompt must be at least 50 characters long');
        }
        
        if (this.modelResponses.length < 4) {
            errors.push('Generate at least 4 model responses');
        }
        
        if (this.rubricCriteria.length === 0) {
            errors.push('Create at least one rubric criterion');
        }
        
        return errors;
    }

    checkScoreValidation() {
        for (let i = 1; i <= 4; i++) {
            const score = this.updateScore(i);
            if (score >= 30) {
                return false;
            }
        }
        return true;
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notification-text');
        
        text.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    }

    toggleMetricVisibility(metricElement) {
        const criteria = metricElement.querySelector('.metric-criteria');
        
        // Always allow toggling, regardless of evaluation status
        const isHidden = criteria.style.display === 'none' || 
                       window.getComputedStyle(criteria).display === 'none';
        criteria.style.display = isHidden ? 'block' : 'none';
    }

    handleCriterionClick(criterionElement) {
        const metricItem = criterionElement.closest('.metric-item');
        const metricName = metricItem.dataset.metric;
        const score = parseInt(criterionElement.dataset.score);
        
        // Remove selected class from all criteria in this metric
        metricItem.querySelectorAll('.criterion.clickable').forEach(criterion => {
            criterion.classList.remove('selected');
        });
        
        // Add selected class to clicked criterion
        criterionElement.classList.add('selected');
        
        // Update metric score
        this.metricScores[metricName] = score;
        
        // Update score display in header
        const scoreSpan = metricItem.querySelector('.metric-score');
        if (scoreSpan) {
            scoreSpan.textContent = score;
            scoreSpan.style.color = this.getScoreColor(score);
        }
        
        // Mark metric as evaluated
        metricItem.classList.add('evaluated');
        
        // Hide criteria after selection
        const metricCriteria = metricItem.querySelector('.metric-criteria');
        if (metricCriteria) {
            metricCriteria.style.display = 'none';
        }
        
        // Update sidebar scores
        this.updateMetricScores();
        
        // Save to taskData
        this.autoSave();
        
        // Show notification
        const wasEvaluated = this.metricScores[metricName] !== undefined;
        if (wasEvaluated) {
            this.showNotification(`${metricName} updated to: ${score} points`, 'info');
        } else {
            this.showNotification(`${metricName} scored: ${score} points`, 'success');
        }
    }
    
    getScoreColor(score) {
        if (score > 85) return '#28a745'; // Green for >85
        if (score >= 70) return '#ffc107'; // Yellow for 70-84
        return '#dc3545'; // Red for <70
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    window.taskCreator = new TaskCreator();
});

// Global function for sidebar navigation (called from HTML onclick)
function toggleNavStep(step) {
    if (window.taskCreator) {
        window.taskCreator.toggleNavStep(step);
    }
}

function navigateToStep(step) {
    if (window.taskCreator) {
        window.taskCreator.navigateToStep(step);
    }
} 