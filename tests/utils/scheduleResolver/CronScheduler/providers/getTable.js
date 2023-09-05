"use strict";

/**
 * @param {Generator} provider
 */
function getTableFromProvider(provider)
{
    const result = [];
    while (true)
    {
        const input = provider.next();
        if (input.done)
        {
            break;
        }

        result.push(input.value);
    }

    return result;
}

module.exports = getTableFromProvider;