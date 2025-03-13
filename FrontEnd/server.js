const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/token', (req, res) => {
    const { clientId, clientSecret, inputType, n, static: staticAttrs, dynamic: dynamicAttrs, volatile: volatileAttrs } = req.body;

    if (!clientId || !clientSecret || !n || n < 32 || !staticAttrs.length || !dynamicAttrs.length || !volatileAttrs.length) {
        return res.status(400).json({ error: 'Invalid input: n must be >= 32 and all attribute arrays must be non-empty' });
    }

    try {
        const { token, steps, parts } = generateToken({ staticAttrs, dynamicAttrs, volatileAttrs }, n);
        res.json({
            identity_token: token,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'read write',
            steps: steps,
            parts: parts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function generateToken(inputs, n) {
    const steps = {};
    const toBinary = (str) => [...Buffer.from(str, 'utf8')].map(byte => byte.toString(2).padStart(8, '0')).join('');

    steps.binaryConversion = {
        static: inputs.staticAttrs.map((val, i) => `${i + 1}: ${toBinary(val).slice(0, 32)}...`),
        dynamic: inputs.dynamicAttrs.map((val, i) => `${i + 1}: ${toBinary(val).slice(0, 32)}...`),
        volatile: inputs.volatileAttrs.map((val, i) => `${i + 1}: ${toBinary(val).slice(0, 32)}...`)
    };

    const staticBin = inputs.staticAttrs.map(toBinary).join('');
    steps.staticCombined = staticBin.slice(0, 64) + '...';

    const dynamicBin = inputs.dynamicAttrs.map(toBinary);
    const volatileBin = inputs.volatileAttrs.map(toBinary);

    const dynamicFull = dynamicBin.map(d => staticBin + d);
    const volatileFull = volatileBin.map(v => staticBin + v);
    steps.fullCombinations = {
        dynamic: dynamicFull.map((d, i) => `${i + 1}: ${d.slice(0, 64)}...`),
        volatile: volatileFull.map((v, i) => `${i + 1}: ${v.slice(0, 64)}...`)
    };

    const hashDynamic = dynamicFull.map(d => crypto.createHash('sha256').update(d).digest('hex'));
    const hashVolatile = volatileFull.map(v => crypto.createHash('sha256').update(v).digest('hex'));
    steps.hashes = {
        dynamic: hashDynamic,
        volatile: hashVolatile
    };

    // Distribute n: 50% to dynamic (split evenly), 12.5% to volatile (split evenly), rest to static influence
    const dynamicBitsTotal = Math.floor(n / 2);
    const volatileBitsTotal = Math.floor(n / 8);
    const dynamicBitsPer = Math.floor(dynamicBitsTotal / inputs.dynamicAttrs.length);
    const volatileBitsPer = Math.floor(volatileBitsTotal / inputs.volatileAttrs.length);

    const dynamicParts = hashDynamic.map(h => h.slice(0, dynamicBitsPer));
    const volatileParts = hashVolatile.map(h => h.slice(0, volatileBitsPer));
    steps.bitExtraction = {
        dynamic: dynamicParts,
        volatile: volatileParts,
        bitsUsed: { dynamic: dynamicBitsPer, volatile: volatileBitsPer }
    };

    const identityToken = dynamicParts.join('') + volatileParts.join('');
    steps.identityToken = identityToken;

    let finalToken = '';
    const windowSteps = [];
    for (let i = 0; i < identityToken.length - 3; i += 1) {
        const window = identityToken.slice(i, i + 4).padEnd(4, '0');
        const windowResult = window[0] + window[3];
        windowSteps.push({ window, result: windowResult });
        finalToken += windowResult;
    }
    steps.slidingWindow = windowSteps.slice(0, 10);

    const parts = {
        dynamic1Length: dynamicParts.join('').length * 2, // Dynamic influence
        dynamic2Length: 0, // For compatibility with frontend coloring
        volatileLength: volatileParts.join('').length * 2
    };

    return { token: finalToken || 'default_token_0000', steps, parts };
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});