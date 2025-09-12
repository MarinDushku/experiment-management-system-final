# Getting Started - User Guide

Welcome to the Research Experiment Management System! This guide will help you get started with using the system as a participant, researcher, or administrator.

## What is the Research Experiment Management System?

This system is designed for conducting research experiments with EEG (brain activity) data collection using OpenBCI hardware. It supports:

- **Multi-modal experiments** with audio, visual, and text stimuli
- **Real-time EEG data collection** from OpenBCI devices
- **Comprehensive data management** and analysis
- **Role-based access control** for different user types

## User Roles

### Participant (User Role)
- Participate in research experiments
- View assigned trials and steps
- Complete experimental sessions

### Researcher
- Create and manage experiments
- Design experimental protocols
- Collect and analyze data
- Manage participants

### Administrator
- Full system access
- User management
- System configuration
- Data oversight

## System Access

### Web Interface
The system provides a user-friendly web interface accessible through your browser:

**Development:** http://localhost:3000
**Production:** http://localhost:80

### Account Creation
1. Navigate to the registration page
2. Choose your username and secure password
3. Select your role (default: User/Participant)
4. Click "Register"

### Login
1. Go to the login page
2. Enter your username and password
3. Click "Login"

## For Participants

### Participating in an Experiment

1. **Login** to your account
2. **View Experiments** - You'll see experiments you're assigned to participate in
3. **Start a Trial** - Click on an available trial to begin
4. **Follow Instructions** - The system will guide you through each step:
   - **Audio Steps**: Listen to audio stimuli (headphones recommended)
   - **Visual Steps**: View visual displays or instructions
   - **Text Steps**: Read instructions or answer questions
   - **EEG Steps**: Remain still while EEG data is collected

### During EEG Recording
- **Stay relaxed** and minimize movement
- **Follow specific instructions** (e.g., eyes open/closed)
- **Alert the researcher** if you experience any discomfort
- **Wait for confirmation** before moving after recording stops

### Tips for Best Results
- **Arrive well-rested** and avoid caffeine before sessions
- **Inform researchers** of any medications or health conditions
- **Ask questions** if any instructions are unclear
- **Stay focused** during tasks but remain comfortable

## For Researchers

### Creating Your First Experiment

#### Step 1: Plan Your Experiment
Before using the system, plan:
- Experiment objectives and hypothesis
- Required stimuli (audio files, visual content, instructions)
- EEG recording requirements
- Trial structure and timing

#### Step 2: Create the Experiment
1. **Login** as a researcher
2. **Navigate** to "Experiments" section
3. **Click** "Create New Experiment"
4. **Fill in details**:
   - Experiment name
   - Detailed description
   - Status (Draft/Active/Completed)

#### Step 3: Design Experimental Steps
1. **Go to** "Steps" section
2. **Create steps** for your experiment:

**Audio Step Example:**
- Name: "Relaxing Background Music"
- Type: Audio
- Duration: 60 seconds
- Content: Upload or reference audio file

**EEG Step Example:**
- Name: "Baseline EEG Recording"
- Type: EEG
- Duration: 120 seconds
- Description: "Record with eyes closed"

**Visual Step Example:**
- Name: "Memory Task Display"
- Type: Visual
- Duration: 30 seconds
- Content: "Display number sequence: 7-3-9-2-8"

**Text Step Example:**
- Name: "Instructions"
- Type: Text
- Duration: 15 seconds
- Content: "Please recall the number sequence"

#### Step 4: Create Trials
1. **Navigate** to "Trials" section
2. **Click** "Create New Trial"
3. **Configure trial**:
   - Trial name (e.g., "Trial 1 - Baseline")
   - Select your experiment
   - Choose participant (if known)
   - Add and order your experimental steps

#### Step 5: Activate Your Experiment
1. **Return** to your experiment
2. **Change status** from "Draft" to "Active"
3. **Assign participants** to trials

### Managing EEG Data Collection

#### Before Starting
1. **Setup OpenBCI device** and ensure proper connection
2. **Check device status** in the system
3. **Prepare participant** with proper electrode placement
4. **Test signal quality** before beginning

#### During Collection
1. **Start recording** through the system interface
2. **Monitor data quality** and participant comfort
3. **Follow your experimental protocol** timing
4. **Stop recording** at appropriate intervals

#### After Collection
1. **Verify data files** were created successfully
2. **Review data quality** and completeness
3. **Document any issues** or observations
4. **Backup data files** as per your protocol

### Data Management

#### File Organization
- EEG data files are automatically named with timestamps
- Audio uploads are stored in organized directories  
- Experimental metadata is saved in the database

#### Data Analysis
- Export EEG data in standard CSV format
- Use external tools (MATLAB, Python, R) for analysis
- Maintain experimental documentation

## For Administrators

### User Management
1. **Access** the admin panel
2. **View all users** in the system
3. **Modify user roles** as needed
4. **Create admin accounts** for other researchers

### System Monitoring
- **Monitor system** performance and usage
- **Review experiment** data and compliance
- **Manage storage** and backup procedures
- **Configure system** settings and security

### Data Governance
- **Implement data** retention policies
- **Ensure compliance** with research ethics
- **Manage participant** privacy and consent
- **Oversee data** backup and security

## Troubleshooting

### Common Issues

#### Login Problems
- **Check credentials** are entered correctly
- **Verify account** has been activated
- **Contact administrator** if account is locked

#### EEG Recording Issues
- **Check device** connection and status
- **Verify electrode** contact and impedance
- **Restart device** if connection is lost
- **Contact technical support** for hardware issues

#### Audio/Visual Problems
- **Check browser** compatibility and settings
- **Enable audio/video** permissions if prompted
- **Test with headphones** for better audio quality
- **Update browser** if experiencing compatibility issues

#### Performance Issues
- **Close unnecessary** browser tabs and applications
- **Check internet** connection stability
- **Clear browser** cache if pages load slowly
- **Report persistent** issues to system administrators

### Getting Help

#### Documentation
- **Review** this user guide thoroughly
- **Check** the FAQ section for common questions
- **Consult** API documentation for technical details

#### Support Contacts
- **Technical Issues**: Contact your system administrator
- **Research Questions**: Consult with your research supervisor
- **Hardware Problems**: Contact OpenBCI support
- **Account Issues**: Contact the system administrator

## Best Practices

### For Participants
- **Arrive on time** and prepared for sessions
- **Follow safety** guidelines for EEG equipment
- **Communicate any** discomfort immediately
- **Maintain consistency** across experimental sessions

### For Researchers
- **Plan experiments** thoroughly before implementation
- **Test all systems** before participant sessions
- **Document procedures** and any deviations
- **Backup data** regularly and securely
- **Maintain participant** confidentiality

### For All Users
- **Use strong passwords** and change them regularly
- **Log out properly** when finished with sessions
- **Report security** concerns immediately
- **Follow institutional** guidelines for research data

## Next Steps

1. **Complete** your account setup and profile
2. **Familiarize yourself** with the interface
3. **Review** your role-specific features
4. **Contact support** with any questions
5. **Begin** your first experiment or participation

For more detailed information, see:
- [FAQ](./faq.md)
- [API Documentation](../api/)
- [Developer Guide](../developer/)
- [Troubleshooting](../developer/troubleshooting.md)