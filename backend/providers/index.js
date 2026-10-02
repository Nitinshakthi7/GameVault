const rawg = require('./rawgProvider');
const mock = require('./mockProvider');

const providers = { rawg, mock };

function getProvider(name = process.env.GAME_PROVIDER || (process.env.RAWG_API_KEY ? 'rawg' : 'mock')) {
    return providers[name] || mock;
}

module.exports = { getProvider, providers };
