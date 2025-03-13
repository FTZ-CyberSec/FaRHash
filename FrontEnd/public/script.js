// Clear history on page load
window.addEventListener('load', () => {
    localStorage.removeItem('tokenHistory');
});

let staticCount = 2;
let dynamicCount = 2;
let volatileCount = 1;

document.getElementById('inputType').addEventListener('change', (e) => {
    const isCustom = e.target.value === 'Custom';
    document.getElementById('staticControls').classList.toggle('hidden', !isCustom);
    document.getElementById('dynamicControls').classList.toggle('hidden', !isCustom);
    document.getElementById('volatileControls').classList.toggle('hidden', !isCustom);
});

document.getElementById('addStatic').addEventListener('click', () => {
    if (staticCount < 5) {
        staticCount++;
        addField('staticFields', 'static', staticCount);
    }
});

document.getElementById('removeStatic').addEventListener('click', () => {
    if (staticCount > 2) {
        removeField('staticFields', staticCount);
        staticCount--;
    }
});

document.getElementById('addDynamic').addEventListener('click', () => {
    if (dynamicCount < 8) {
        dynamicCount++;
        addField('dynamicFields', 'dynamic', dynamicCount);
    }
});

document.getElementById('removeDynamic').addEventListener('click', () => {
    if (dynamicCount > 2) {
        removeField('dynamicFields', dynamicCount);
        dynamicCount--;
    }
});

document.getElementById('addVolatile').addEventListener('click', () => {
    if (volatileCount < 10) {
        volatileCount++;
        addField('volatileFields', 'volatile', volatileCount);
    }
});

document.getElementById('removeVolatile').addEventListener('click', () => {
    if (volatileCount > 1) {
        removeField('volatileFields', volatileCount);
        volatileCount--;
    }
});

function addField(containerId, type, count) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
        <label for="${type}${count}">${type.charAt(0).toUpperCase() + type.slice(1)} ${count}</label>
        <input type="text" id="${type}${count}" name="${type}${count}" required placeholder="${type.charAt(0).toUpperCase() + type.slice(1)} Value ${count}">
        <button type="button" class="record" data-target="${type}${count}">Record</button>
    `;
    container.appendChild(div);
    bindRecordButtons();
}

function removeField(containerId, count) {
    const container = document.getElementById(containerId);
    const field = container.querySelector(`#${containerId.slice(0, -6)}${count}`);
    if (field) container.removeChild(field.parentElement);
}

function bindRecordButtons() {
    document.querySelectorAll('.record').forEach(button => {
        button.removeEventListener('click', recordHandler); // Avoid duplicate listeners
        button.addEventListener('click', recordHandler);
    });
}

function recordHandler() {
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    input.value = `attr_${Math.random().toString(36).substr(2, 8)}`;
}

bindRecordButtons();

document.getElementById('tokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        clientId: document.getElementById('clientId').value,
        clientSecret: document.getElementById('clientSecret').value,
        inputType: document.getElementById('inputType').value,
        n: parseInt(document.getElementById('n').value),
        static: [],
        dynamic: [],
        volatile: []
    };

    for (let i = 1; i <= staticCount; i++) {
        formData.static.push(document.getElementById(`static${i}`).value);
    }
    for (let i = 1; i <= dynamicCount; i++) {
        formData.dynamic.push(document.getElementById(`dynamic${i}`).value);
    }
    for (let i = 1; i <= volatileCount; i++) {
        formData.volatile.push(document.getElementById(`volatile${i}`).value);
    }

    const resultDiv = document.getElementById('result');
    const tokenOutput = document.getElementById('tokenOutput');
    const scatterContainer = document.getElementById('scatterContainer');
    const stepsOutput = document.getElementById('stepsOutput');

    try {
        const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            let tokenHistory = JSON.parse(localStorage.getItem('tokenHistory') || '[]');
            tokenHistory.unshift({ token: data.identity_token, parts: data.parts });
            if (tokenHistory.length > 10) tokenHistory.pop();
            localStorage.setItem('tokenHistory', JSON.stringify(tokenHistory));
            const lastToken = tokenHistory[1]?.token || '';

            const { dynamic1Length, dynamic2Length, volatileLength } = data.parts;
            const currentTokenHtml = formatToken(data.identity_token, dynamic1Length, dynamic2Length, volatileLength, lastToken);
            tokenOutput.innerHTML = `<div class="token-container">Current Identity Token (t1): ${currentTokenHtml}</div>`;

            scatterContainer.innerHTML = '';
            tokenHistory.forEach((entry, index) => {
                const div = document.createElement('div');
                div.className = 'scatter-plot-item';
                const compareToken = tokenHistory[index + 1]?.token || '';
                const hamming = hammingDistance(entry.token, compareToken);
                const label = `t${tokenHistory.length - index}`;
                const compareLabel = compareToken ? `t${tokenHistory.length - index - 1}` : 'None';
                div.innerHTML = `<div class="token-container">${label}: ${entry.token} - ${formatToken(entry.token, entry.parts.dynamic1Length, entry.parts.dynamic2Length, entry.parts.volatileLength, compareToken)} (Hamming Distance: ${hamming})</div>`;
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                canvas.id = `scatter-${tokenHistory.length - index}`;
                div.appendChild(canvas);
                scatterContainer.appendChild(div);
                const ctx = canvas.getContext('2d');
                drawScatterPlot(ctx, entry.token, compareToken, `${label} vs ${compareLabel}`);
            });

            stepsOutput.innerHTML = `
                <h4>Step 1: Binary Conversion</h4>
                <pre>${JSON.stringify(data.steps.binaryConversion, null, 2)}</pre>
                <h4>Step 2: Static Concatenation</h4>
                <pre>${data.steps.staticCombined}</pre>
                <h4>Step 3: Full Combinations</h4>
                <pre>${JSON.stringify(data.steps.fullCombinations, null, 2)}</pre>
                <h4>Step 4: SHA256 Hashes</h4>
                <pre>${JSON.stringify(data.steps.hashes, null, 2)}</pre>
                <h4>Step 5: Bit Extraction</h4>
                <pre>${JSON.stringify(data.steps.bitExtraction, null, 2)}</pre>
                <h4>Step 6: Identity Token</h4>
                <pre>${data.steps.identityToken}</pre>
                <h4>Step 7: Sliding Window (First 10 Steps)</h4>
                <pre>${JSON.stringify(data.steps.slidingWindow, null, 2)}</pre>
            `;
            resultDiv.classList.remove('hidden');
            tokenOutput.style.color = '#333';

            setTimeout(() => {
                document.querySelectorAll('.changed').forEach(el => {
                    el.style.background = '#fff3cd';
                });
            }, 10);
        } else {
            tokenOutput.textContent = JSON.stringify(data, null, 2);
            scatterContainer.innerHTML = '';
            stepsOutput.innerHTML = '';
            resultDiv.classList.remove('hidden');
            tokenOutput.style.color = '#dc3545';
        }
    } catch (error) {
        tokenOutput.textContent = `Error: ${error.message}`;
        scatterContainer.innerHTML = '';
        stepsOutput.innerHTML = '';
        resultDiv.classList.remove('hidden');
        tokenOutput.style.color = '#dc3545';
    }
});

function formatToken(token, dynamic1Length, dynamic2Length, volatileLength, compareToken = '') {
    let html = '';
    for (let i = 0; i < token.length; i++) {
        let className = '';
        if (i < dynamic1Length) {
            className = 'dynamic1';
        } else if (i < dynamic1Length + dynamic2Length) {
            className = 'dynamic2';
        } else if (i < dynamic1Length + dynamic2Length + volatileLength) {
            className = 'volatile';
        }
        if (compareToken && token[i] !== compareToken[i]) {
            className += ' changed';
        }
        html += `<span class="${className}">${token[i]}</span>`;
    }
    return html;
}

function hammingDistance(str1, str2) {
    if (!str2 || str1.length !== str2.length) return '-';
    let distance = 0;
    for (let i = 0; i < str1.length; i++) {
        if (str1[i] !== str2[i]) distance++;
    }
    return distance;
}

function getRanks(str) {
    const charArray = str.split('');
    const sorted = [...charArray].sort();
    return charArray.map(char => sorted.indexOf(char) + 1);
}

function drawScatterPlot(ctx, currentToken, referenceToken, title) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '10px Roboto';
    ctx.fillText('Current', width / 2, height - 5);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Previous', -height / 2, 10);
    ctx.restore();
    ctx.fillText(title, width / 2, 15, width - 20);

    const currentRanks = getRanks(currentToken);
    const referenceRanks = referenceToken ? getRanks(referenceToken) : Array(currentToken.length).fill(0);
    const maxRank = Math.max(...currentRanks, ...referenceRanks, 1);

    ctx.fillStyle = '#007bff';
    for (let i = 0; i < currentToken.length; i++) {
        const x = padding + (currentRanks[i] / maxRank) * (width - 2 * padding);
        const y = height - padding - (referenceRanks[i] / maxRank) * (height - 2 * padding);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}