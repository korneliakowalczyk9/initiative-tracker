const initialStatus = 'New';
const statusDetails = {
	New: {
		description: 'Created and not yet submitted for review.',
	},
	'Under review': {
		description:
			'The reviewing organization is considering whether to implement this initiative.',
	},
	'In progress': {
		description:
			'Accepted for implementation. This mapping does not assert that work has started.',
	},
	Withdrawn: {
		description:
			'Not to be implemented within the defined scope. This does not alter the broader portfolio record.',
	},
};

const startingInitiatives = [
	{
		id: 'DEMO-001',
		name: 'Customer onboarding improvement',
		type: 'Process improvement',
		division: 'Division A',
		owner: 'Decision owner A',
		stage: 'New',
		decisionWindow: 'Assign decision owner',
		health: 'Not yet assessed',
		freshness: 'No update yet',
	},
	{
		id: 'DEMO-002',
		name: 'Supplier data transfer',
		type: 'Data-sharing initiative',
		division: 'Division B',
		owner: 'Decision owner B',
		stage: 'Under review',
		decisionWindow: 'Defined review period',
		health: 'On track · sample date',
		freshness: 'Overdue',
	},
	{
		id: 'DEMO-003',
		name: 'Support case routing refresh',
		type: 'Process improvement',
		division: 'Division C',
		owner: 'Decision owner C',
		stage: 'Under review',
		decisionWindow: 'Defined review period',
		health: 'Not yet assessed',
		freshness: 'No update yet',
	},
];

let initiatives = startingInitiatives.map((initiative) => ({ ...initiative }));
let currentStatus = initialStatus;
let selectedInitiative = null;

const queueScreen = document.getElementById('queue-screen');
const decisionScreen = document.getElementById('decision-screen');
const queueTitle = document.getElementById('queue-title');
const initiativeRows = document.getElementById('initiative-rows');
const emptyState = document.getElementById('empty-state');
const queueFeedback = document.getElementById('queue-feedback');
const searchInput = document.getElementById('search-initiatives');
const divisionFilter = document.getElementById('division-filter');
const stageFilter = document.getElementById('stage-filter');
const countNew = document.getElementById('count-new');
const countReview = document.getElementById('count-review');
const countOverdue = document.getElementById('count-overdue');
const statusBadge = document.getElementById('status-badge');
const statusPanel = document.getElementById('status-panel');
const statusDescription = document.getElementById('status-description');
const workflowPath = document.getElementById('workflow-path');
const initiativeNumber = document.getElementById('initiative-number');
const initiativeTitle = document.getElementById('initiative-title');
const initiativeType = document.getElementById('initiative-type');
const initiativeDivision = document.getElementById('initiative-division');
const initiativeOwner = document.getElementById('initiative-owner');
const initiativeWindow = document.getElementById('initiative-window');
const newActions = document.getElementById('actions-new');
const reviewActions = document.getElementById('actions-review');
const terminalActions = document.getElementById('actions-terminal');
const terminalMessage = document.getElementById('terminal-message');
const decisionInputs = document.querySelectorAll('input[name="decision"]');
const decisionFeedback = document.getElementById('decision-feedback');
const confirmDecision = document.getElementById('confirm-decision');

function selectedDecision() {
	return document.querySelector('input[name="decision"]:checked');
}

function addTextCell(row, label, value) {
	const cell = document.createElement('td');
	cell.dataset.label = label;
	cell.textContent = value;
	row.append(cell);
}

function renderQueue() {
	const activeInitiatives = initiatives.filter(
		(initiative) => initiative.stage !== 'Withdrawn'
	);
	const searchTerm = searchInput.value.trim().toLowerCase();
	const division = divisionFilter.value;
	const stage = stageFilter.value;
	const visibleInitiatives = activeInitiatives.filter((initiative) => {
		const matchesSearch = `${initiative.id} ${initiative.name}`
			.toLowerCase()
			.includes(searchTerm);
		return (
			matchesSearch &&
			(!division || initiative.division === division) &&
			(!stage || initiative.stage === stage)
		);
	});

	countNew.textContent = activeInitiatives.filter(
		(initiative) => initiative.stage === 'New'
	).length;
	countReview.textContent = activeInitiatives.filter(
		(initiative) => initiative.stage === 'Under review'
	).length;
	countOverdue.textContent = activeInitiatives.filter(
		(initiative) =>
			initiative.stage === 'Under review' && initiative.freshness === 'Overdue'
	).length;

	initiativeRows.replaceChildren();
	visibleInitiatives.forEach((initiative) => {
		const row = document.createElement('tr');
		const initiativeCell = document.createElement('td');
		initiativeCell.dataset.label = 'Initiative';
		const openButton = document.createElement('button');
		openButton.className = 'initiative-link';
		openButton.type = 'button';
		openButton.setAttribute('aria-label', `Open ${initiative.name}`);
		openButton.addEventListener('click', () => openInitiative(initiative.id));
		const number = document.createElement('span');
		number.className = 'initiative-number';
		number.textContent = initiative.id;
		const name = document.createElement('strong');
		name.textContent = initiative.name;
		const type = document.createElement('span');
		type.className = 'initiative-type';
		type.textContent = initiative.type;
		openButton.append(number, name, type);
		initiativeCell.append(openButton);
		row.append(initiativeCell);
		addTextCell(row, 'Division', initiative.division);
		addTextCell(row, 'Decision owner', initiative.owner);
		addTextCell(row, 'Stage', initiative.stage);
		addTextCell(row, 'Decision window', initiative.decisionWindow);

		const healthCell = document.createElement('td');
		healthCell.dataset.label = 'Health · freshness';
		const health = document.createElement('span');
		health.textContent = initiative.health;
		const freshness = document.createElement('span');
		freshness.className = 'freshness-value';
		freshness.dataset.freshness = initiative.freshness;
		freshness.textContent = initiative.freshness;
		healthCell.append(health, freshness);
		row.append(healthCell);
		initiativeRows.append(row);
	});

	emptyState.hidden = visibleInitiatives.length > 0;
}

function openInitiative(id) {
	selectedInitiative = initiatives.find((initiative) => initiative.id === id);
	if (!selectedInitiative) return;

	currentStatus = selectedInitiative.stage;
	decisionInputs.forEach((input) => {
		input.checked = false;
	});
	decisionFeedback.textContent = 'Select an outcome to enable confirmation.';
	initiativeNumber.textContent = selectedInitiative.id;
	initiativeTitle.textContent = selectedInitiative.name;
	initiativeType.textContent = selectedInitiative.type;
	initiativeDivision.textContent = selectedInitiative.division;
	initiativeOwner.textContent = `Coordination team · ${selectedInitiative.owner}`;
	initiativeWindow.textContent = selectedInitiative.decisionWindow;
	queueScreen.hidden = true;
	decisionScreen.hidden = false;
	renderStatus();
	statusPanel.focus();
}

function returnToQueue() {
	decisionScreen.hidden = true;
	queueScreen.hidden = false;
	selectedInitiative = null;
	renderQueue();
	queueTitle.focus();
}

function renderStatus() {
	statusBadge.textContent = currentStatus;
	statusBadge.dataset.status = currentStatus;
	statusDescription.textContent = statusDetails[currentStatus].description;
	workflowPath.textContent = {
		New: 'New',
		'Under review': 'New → Under review',
		'In progress': 'New → Under review → In progress',
		Withdrawn: 'New → Under review → Withdrawn',
	}[currentStatus];
	newActions.hidden = currentStatus !== 'New';
	reviewActions.hidden = currentStatus !== 'Under review';
	terminalActions.hidden =
		currentStatus === 'New' || currentStatus === 'Under review';
	terminalActions.dataset.status = currentStatus;
	confirmDecision.disabled =
		currentStatus !== 'Under review' || !selectedDecision();

	if (currentStatus === 'In progress') {
		terminalMessage.textContent =
			'Accepted for implementation maps to In progress. This mapping does not assert that work has started.';
	} else if (currentStatus === 'Withdrawn') {
		terminalMessage.textContent =
			'This initiative will not be implemented within the defined scope. The broader portfolio record is unchanged.';
	}
}

searchInput.addEventListener('input', renderQueue);
divisionFilter.addEventListener('change', renderQueue);
stageFilter.addEventListener('change', renderQueue);
document
	.getElementById('back-to-queue')
	.addEventListener('click', returnToQueue);
document
	.getElementById('return-to-queue')
	.addEventListener('click', returnToQueue);

document.getElementById('send-for-review').addEventListener('click', () => {
	currentStatus = 'Under review';
	if (selectedInitiative) {
		selectedInitiative.stage = currentStatus;
		selectedInitiative.decisionWindow = 'Defined review period';
	}
	renderStatus();
	statusPanel.focus();
});

decisionInputs.forEach((input) => {
	input.addEventListener('change', () => {
		decisionFeedback.textContent = `Selected outcome: ${input.value}. Confirm to update the workflow status.`;
		confirmDecision.disabled = false;
	});
});

confirmDecision.addEventListener('click', () => {
	const decision = selectedDecision();
	if (!decision) return;

	currentStatus = decision.value;
	if (selectedInitiative) selectedInitiative.stage = currentStatus;
	renderStatus();
	statusPanel.focus();
});

document.getElementById('reset-demo').addEventListener('click', () => {
	initiatives = startingInitiatives.map((initiative) => ({ ...initiative }));
	currentStatus = initialStatus;
	decisionInputs.forEach((input) => {
		input.checked = false;
	});
	decisionFeedback.textContent = 'Select an outcome to enable confirmation.';
	searchInput.value = '';
	divisionFilter.value = '';
	stageFilter.value = '';
	queueFeedback.textContent = 'The demo has been reset. No changes were saved.';
	returnToQueue();
});

renderStatus();
renderQueue();
