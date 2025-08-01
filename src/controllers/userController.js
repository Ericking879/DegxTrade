exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }).select('email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};