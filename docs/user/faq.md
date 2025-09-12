# Frequently Asked Questions (FAQ)

## General Questions

### What is the Research Experiment Management System?
The system is a comprehensive platform for conducting research experiments with EEG data collection. It allows researchers to design experiments, collect real-time brain activity data using OpenBCI hardware, and manage participants throughout the research process.

### Who can use this system?
The system supports three types of users:
- **Participants**: Individuals taking part in research studies
- **Researchers**: Scientists designing and conducting experiments
- **Administrators**: System managers with full access rights

### What equipment do I need?
For basic participation, you only need:
- A computer with internet access
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Headphones (recommended for audio experiments)

For EEG data collection, researchers need:
- OpenBCI Cyton or similar EEG device
- EEG electrodes and conductive gel
- Computer with USB/Bluetooth connectivity

### Is my data secure?
Yes, the system implements several security measures:
- Encrypted user authentication with JWT tokens
- Role-based access control
- Secure database storage
- Regular data backups
- Compliance with research ethics guidelines

## Account and Access

### How do I create an account?
1. Go to the registration page
2. Enter a unique username and secure password
3. Select your role (User/Participant is default)
4. Click "Register" to create your account

### I forgot my password. How do I reset it?
Currently, password reset requires administrator assistance. Contact your system administrator with:
- Your username
- Your institutional email address
- Verification of your identity

### Can I change my role?
Role changes must be made by an administrator. Contact them if you need your permissions upgraded from User to Researcher.

### Why can't I access certain features?
Feature access depends on your role:
- **Users**: Can participate in experiments and view assigned trials
- **Researchers**: Can create experiments, manage trials, and collect data
- **Admins**: Have full system access

## Experiments and Trials

### How do I find experiments I can participate in?
After logging in:
1. Navigate to the "Experiments" section
2. You'll see experiments you're assigned to
3. Click on an experiment to view available trials
4. Select a trial to begin participation

### What types of experimental steps are supported?
The system supports four types of steps:
- **Audio**: Play sound files or music
- **Visual**: Display images, text, or visual stimuli  
- **Text**: Show instructions or questions
- **EEG**: Record brain activity data

### How long do experiments typically take?
Experiment duration varies by design:
- Simple trials: 5-15 minutes
- Standard experiments: 30-60 minutes
- Complex studies: 1-2 hours
- Multi-session studies: Multiple visits over weeks

### Can I pause or stop an experiment?
- Individual steps run for their set duration
- Between steps, you can typically take short breaks
- For safety, EEG recording should not be interrupted
- Contact the researcher if you need to stop unexpectedly

### What should I do if I experience technical difficulties during an experiment?
1. Stay calm and don't worry about "ruining" the data
2. Note what happened and when
3. Alert the researcher immediately
4. Follow their instructions for proceeding or restarting

## EEG Data Collection

### Is EEG recording safe?
Yes, EEG recording is completely safe:
- It only measures electrical activity; doesn't stimulate the brain
- Uses very low voltage signals
- Non-invasive with surface electrodes
- Widely used in research and medical settings

### Will the electrodes hurt?
EEG electrodes are designed for comfort:
- Modern electrodes are small and lightweight
- Conductive gel may feel cool and slightly wet
- Mild skin irritation is rare but possible
- Alert researchers to any discomfort immediately

### How should I prepare for EEG recording?
**Before your session:**
- Wash your hair with regular shampoo (no conditioner)
- Avoid hair products, oils, or sprays
- Get adequate sleep and avoid excessive caffeine
- Wear comfortable clothing

**During setup:**
- Remain still while electrodes are positioned
- Ask questions if you're unsure about anything
- Inform researchers of any skin sensitivities

### What should I do during EEG recording?
- **Minimize movement**: Stay as still as possible
- **Avoid talking**: Unless specifically instructed
- **Control eye movements**: Follow specific instructions (eyes open/closed)
- **Stay relaxed**: Muscle tension can affect recordings
- **Focus on the task**: Follow experimental instructions carefully

### Can I see my brain waves?
- Real-time viewing depends on the experiment design
- Some studies show live feedback; others don't
- Researchers may share general results after completion
- Individual detailed analysis typically isn't provided immediately

## Technical Issues

### The system is running slowly. What can I do?
Try these steps:
1. Close unnecessary browser tabs and applications
2. Check your internet connection speed
3. Clear your browser cache and cookies
4. Try a different browser
5. Restart your computer
6. Contact technical support if problems persist

### I'm having audio problems during experiments.
**For audio issues:**
1. Check your volume settings
2. Test your headphones/speakers
3. Enable audio permissions in your browser
4. Try refreshing the page
5. Use Chrome or Firefox for best compatibility

### The EEG device won't connect.
**For connection issues:**
1. Check USB cable connections
2. Verify device power status
3. Restart the OpenBCI device
4. Check device status in the system
5. Contact the researcher for technical support

### I can't upload files.
**For file upload problems:**
1. Check file size (usually limited to 10-50MB)
2. Verify file format (MP3, WAV for audio)
3. Ensure stable internet connection
4. Try a different browser
5. Contact support if issues persist

## Data and Privacy

### What happens to my EEG data?
- Data is stored securely on research servers
- Access is limited to authorized researchers
- Data is used only for the stated research purposes
- Individual privacy is protected through anonymization
- Data retention follows institutional policies

### Can I request my data be deleted?
Yes, you have rights regarding your data:
- You can withdraw from studies (following ethical guidelines)
- Request data deletion (subject to research requirements)
- Access your data records (within reasonable limits)
- Contact the research team or administrator

### How is my personal information protected?
- Personal data is kept separate from research data
- Database access requires authentication
- Regular security updates and monitoring
- Compliance with institutional privacy policies
- Limited data sharing only for research collaboration

## Research-Specific Questions

### How do I create my first experiment as a researcher?
Follow these steps:
1. Plan your experimental design thoroughly
2. Prepare all stimuli (audio files, instructions, etc.)
3. Create the experiment record in the system
4. Design and create individual experimental steps
5. Organize steps into trials
6. Test the complete experimental flow
7. Activate the experiment and assign participants

### How do I upload audio files for my experiment?
1. Navigate to the file upload section
2. Select "Upload Audio File"
3. Choose your file (MP3, WAV, M4A supported)
4. Wait for upload confirmation
5. Note the file path for use in audio steps

### Can I run the same participant through multiple trials?
Yes, you can:
- Assign the same participant to multiple trials
- Run trials on the same day or across sessions
- Ensure adequate rest between trials
- Follow ethical guidelines for participant burden

### How do I analyze the EEG data?
The system provides:
- Raw EEG data in CSV format
- Timestamp synchronization with experimental events
- Export capabilities for external analysis
- Integration with popular analysis tools (MATLAB, Python, R)

### Can I collaborate with other researchers?
Currently:
- Each researcher manages their own experiments
- Data sharing requires manual export/import
- Contact administrators for multi-researcher projects
- Future versions may include collaboration features

## Troubleshooting Specific Scenarios

### "Access denied" error messages
This usually means:
- You're not logged in (login again)
- Your role doesn't have required permissions
- Your session has expired (login again)
- Contact administrator if problems persist

### Experiment won't start
Check that:
- The experiment status is "Active"
- You're assigned as a participant
- All required steps are properly configured
- Your browser supports required features

### EEG recording produces poor quality data
Common causes and solutions:
- **Electrode impedance too high**: Reapply conductive gel
- **Movement artifacts**: Minimize head and body movement
- **Electrical interference**: Check nearby electronic devices
- **Poor electrode contact**: Reposition electrodes

### Browser compatibility issues
Recommended browsers:
- **Chrome**: Best overall compatibility
- **Firefox**: Good performance and security
- **Safari**: Works on Mac, some feature limitations
- **Edge**: Recent versions work well
- **Internet Explorer**: Not supported

## Getting Additional Help

### Who should I contact for different types of issues?

**Technical Problems:**
- System administrator
- IT support team
- Include error messages and steps to reproduce

**Research Questions:**
- Your research supervisor
- Principal investigator
- Research ethics committee

**Account Issues:**
- System administrator
- Provide your username and contact information

**Hardware Problems:**
- OpenBCI technical support
- Local technical support team
- Include device model and error descriptions

**Emergency Issues:**
- If you experience any health issues during EEG recording
- Stop the session immediately
- Seek appropriate medical attention
- Report incident to research team

### How can I provide feedback about the system?
We welcome feedback:
- Contact your researcher or administrator
- Submit feedback through institutional channels
- Report bugs with detailed descriptions
- Suggest improvements for future versions

### Where can I learn more about EEG and brain research?
Educational resources:
- OpenBCI community and documentation
- Academic papers on EEG methodology
- Online courses on neuroscience and brain imaging
- Your institution's research training programs

## Future Updates

### Will there be new features added?
The system is actively developed with planned features:
- Enhanced data visualization tools
- Improved collaboration capabilities
- Mobile device support
- Advanced analysis integration
- Real-time feedback systems

### How will I be notified of updates?
- System announcements through the interface
- Email notifications for major changes
- Documentation updates
- Training sessions for new features

For questions not covered in this FAQ, please contact your system administrator or research team.