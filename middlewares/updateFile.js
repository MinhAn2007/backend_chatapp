export const updateProfile = async (req, res) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
        new: true,
      });
      const { _id: id, name, photoURL } = updatedUser;
  
      const token = jwt.sign({ id, name, photoURL }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.status(200).json({ success: true, result: { name, photoURL, token } });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  };
  