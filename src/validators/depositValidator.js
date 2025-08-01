const validateDeposit = ({ coin, network }) => {
  const supported = {
    'BTC': ['BTC', 'BSC', 'ERC20'],
    'ETH': ['ETH', 'BSC', 'ERC20'],
    'USDT': ['ETH', 'BSC', 'TRX'],
    'BNB': ['BSC'],
    'XRP': ['XRP'],
    'XLM': ['XLM']
  };

  if (!coin || !supported[coin.toUpperCase()]) {
    return { error: { message: 'Invalid or unsupported coin' } };
  }

  if (!network || !supported[coin.toUpperCase()].includes(network)) {
    return { error: { message: 'Invalid or unsupported network for selected coin' } };
  }

  return { error: null };
};

module.exports = { validateDeposit };