import datetime
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Permission,
    Role,
    User,
    Profile,
    AuthorizedUser,
    Student,
    Subject,
    Attendance,
    Department,
    HostelRoom,
    HostelOccupant,
    HostelComplaint,
    Book,
    Bus,
    BusRoute,
    Company,
    PlacementApplication,
    FeeStructure,
)

def init_db():
    # 1. Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Ensure initial Admin and Super Admin accounts exist
        admin_user = db.query(User).filter(User.email == "admin1@campus.edu").first()
        if not admin_user:
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if not admin_role:
                admin_role = Role(name="admin", description="Administrator Role")
                db.add(admin_role)
                db.commit()

            admin_user = User(
                email="admin1@campus.edu",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin One",
                institution_id="ADM001",
                status="active",
                is_active=True
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.flush()

            admin_prof = Profile(
                id=str(admin_user.id),
                auth_user_id=str(admin_user.id),
                full_name="Admin One",
                email="admin1@campus.edu",
                role="admin",
                institution_id="ADM001",
                status="active",
                email_verified=True
            )
            db.add(admin_prof)
            db.commit()
            print("Initial Administrator bootstrapped: admin1@campus.edu / admin123")

        if db.query(Role).first() and db.query(User).filter(User.email == "rahul.student@campus.edu").first():
            print("Database already fully seeded.")
            return

        print("Seeding database...")

        # 2. Seed Authorized Users Registry
        # Security: Pre-authorizes institution IDs to prevent unauthorized role claims.
        authorized_records = [
            {"institution_id": "STU001", "email": "rahul.student@campus.edu", "full_name": "Rahul Kumar", "role": "student"},
            {"institution_id": "STU002", "email": "priya.student@campus.edu", "full_name": "Priya Kumar", "role": "student"},
            {"institution_id": "FAC001", "email": "arun.faculty@campus.edu", "full_name": "Dr. Arun Kumar", "role": "faculty"},
            {"institution_id": "FAC002", "email": "meena.faculty@campus.edu", "full_name": "Dr. Meena Kumar", "role": "faculty"},
            {"institution_id": "WAR001", "email": "ramesh.warden@campus.edu", "full_name": "Ramesh Kumar", "role": "hostel_warden"},
            {"institution_id": "PO001", "email": "suresh.placement@campus.edu", "full_name": "Suresh Kumar", "role": "placement_officer"},
            {"institution_id": "ADM001", "email": "admin1@campus.edu", "full_name": "Admin One", "role": "admin"},
            {"institution_id": "ADM002", "email": "admin2@campus.edu", "full_name": "Admin Two", "role": "admin"},
            {"institution_id": "SA001", "email": "superadmin@campus.edu", "full_name": "Super Admin", "role": "super_admin"},
        ]
        for rec in authorized_records:
            exists = db.query(AuthorizedUser).filter(AuthorizedUser.institution_id == rec["institution_id"]).first()
            if not exists:
                auth_record = AuthorizedUser(**rec, is_used=True)
                db.add(auth_record)
        db.commit()

        # 3. Create Standard Roles (Stored as lowercase string identifiers)
        role_names = [
            "student",
            "faculty",
            "admin",
            "hostel_warden",
            "placement_officer",
            "super_admin"
        ]
        roles_dict = {}
        for name in role_names:
            role = db.query(Role).filter(Role.name == name).first()
            if not role:
                role = Role(name=name, description=f"{name.replace('_', ' ').title()} Role")
                db.add(role)
            roles_dict[name] = role
        db.commit()

        # 4. Create Permissions
        permissions_list = [
            "manage_users", "view_analytics", "manage_hostel", 
            "manage_library", "manage_transport", "manage_placement", "manage_finance",
            "manage_admins", "view_audit_logs"
        ]
        perms_dict = {}
        for p_name in permissions_list:
            perm = db.query(Permission).filter(Permission.name == p_name).first()
            if not perm:
                perm = Permission(name=p_name, description=f"Permission to {p_name.replace('_', ' ')}")
                db.add(perm)
            perms_dict[p_name] = perm
        db.commit()

        # Assign all permissions to Admin & Super Admin
        roles_dict["admin"].permissions.extend(list(perms_dict.values()))
        roles_dict["super_admin"].permissions.extend(list(perms_dict.values()))
        db.commit()

        # 5. Create Default Development Accounts with Active Profiles
        # Security: Password hashed securely using bcrypt passlib context
        default_accounts = [
            {"email": "superadmin@campus.edu", "name": "Super Admin", "role": "super_admin", "inst_id": "SA001", "pass": "superadmin123"},
            {"email": "admin1@campus.edu", "name": "Admin One", "role": "admin", "inst_id": "ADM001", "pass": "admin123"},
            {"email": "rahul.student@campus.edu", "name": "Rahul Kumar", "role": "student", "inst_id": "STU001", "pass": "rahul123"},
            {"email": "bhagath.student@campus.edu", "name": "Bhagath Kumar", "role": "student", "inst_id": "STU003", "pass": "bhagath123"},
            {"email": "priya.student@campus.edu", "name": "Priya Kumar", "role": "student", "inst_id": "STU002", "pass": "priya123"},
            {"email": "arun.faculty@campus.edu", "name": "Dr. Arun Kumar", "role": "faculty", "inst_id": "FAC001", "pass": "arun123"},
            {"email": "ramesh.warden@campus.edu", "name": "Ramesh Kumar", "role": "hostel_warden", "inst_id": "WAR001", "pass": "ramesh123"},
            {"email": "suresh.placement@campus.edu", "name": "Suresh Kumar", "role": "placement_officer", "inst_id": "PO001", "pass": "suresh123"},
        ]


        created_users = {}
        for acc in default_accounts:
            user_obj = db.query(User).filter(User.email == acc["email"]).first()
            if not user_obj:
                user_obj = User(
                    email=acc["email"],
                    hashed_password=get_password_hash(acc["pass"]),
                    full_name=acc["name"],
                    institution_id=acc["inst_id"],
                    status="active",
                    is_active=True
                )
                user_obj.roles.append(roles_dict[acc["role"]])
                db.add(user_obj)
                db.flush()
                
                profile_obj = Profile(
                    id=str(user_obj.id),
                    auth_user_id=str(user_obj.id),
                    full_name=acc["name"],
                    email=acc["email"],
                    role=acc["role"],
                    institution_id=acc["inst_id"],
                    status="active",
                    email_verified=True
                )
                db.add(profile_obj)
            created_users[acc["email"]] = user_obj
        db.commit()

        # Create Student Profile for Rahul
        student_user = created_users["rahul.student@campus.edu"]
        student_profile = Student(
            user_id=student_user.id,
            roll_number="STU001",
            cgpa=8.42,
            current_semester=5
        )
        db.add(student_profile)

        # Create Student Profile for Bhagath
        bhagath_user = created_users["bhagath.student@campus.edu"]
        bhagath_profile = Student(
            user_id=bhagath_user.id,
            roll_number="STU003",
            cgpa=8.85,
            current_semester=5
        )
        db.add(bhagath_profile)


        # Create Student Profile for Priya
        priya_user = created_users["priya.student@campus.edu"]
        priya_profile = Student(
            user_id=priya_user.id,
            roll_number="STU002",
            cgpa=9.10,
            current_semester=5
        )
        db.add(priya_profile)
        db.commit()

        # 5. Create default Subjects
        subjects_data = [
            {"code": "CS301", "name": "Automata Theory", "credits": 4},
            {"code": "CS302", "name": "Computer Networks", "credits": 4},
            {"code": "CS303", "name": "Database Management Systems", "credits": 4},
        ]
        subs_dict = {}
        for s_data in subjects_data:
            subject = Subject(code=s_data["code"], name=s_data["name"], credits=s_data["credits"])
            db.add(subject)
            subs_dict[s_data["code"]] = subject
        db.commit()

        # 6. Seed Attendance records for Student
        # Automata Theory: 24 present out of 32
        for i in range(32):
            att = Attendance(
                student_id=student_profile.id,
                subject_id=subs_dict["CS301"].id,
                date=datetime.date.today() - datetime.timedelta(days=i),
                is_present=(i < 24)
            )
            db.add(att)

        # Computer Networks: 31 present out of 34
        for i in range(34):
            att = Attendance(
                student_id=student_profile.id,
                subject_id=subs_dict["CS302"].id,
                date=datetime.date.today() - datetime.timedelta(days=i),
                is_present=(i < 31)
            )
            db.add(att)

        # Database Management Systems: 27 present out of 30
        for i in range(30):
            att = Attendance(
                student_id=student_profile.id,
                subject_id=subs_dict["CS303"].id,
                date=datetime.date.today() - datetime.timedelta(days=i),
                is_present=(i < 27)
            )
            db.add(att)
        db.commit()

        # 7. Seed Hostel Room & Occupant & Complaint
        room = HostelRoom(
            room_number="302-B",
            block_name="C-Block (Boys)",
            capacity=4,
            occupancy_count=1
        )
        db.add(room)
        db.commit()

        occupant = HostelOccupant(
            room_id=room.id,
            student_id=student_profile.id,
            allotted_date=datetime.date.today() - datetime.timedelta(days=120)
        )
        db.add(occupant)

        complaint = HostelComplaint(
            student_id=student_profile.id,
            room_id=room.id,
            title="WiFi router in Room 302 has no power",
            description="The WiFi router went off this morning. We tried power cycling it but it remains dead. Please send a technician.",
            category="WiFi",
            priority="Medium",
            status="Pending"
        )
        db.add(complaint)
        db.commit()

        # 8. Seed Library Books
        books = [
            Book(title="Introduction to Algorithms", author="Cormen, Leiserson, Rivest, Stein", isbn="978-0262033848", category="Computer Science", copies_available=3),
            Book(title="Compilers: Principles, Techniques, and Tools", author="Aho, Lam, Sethi, Ullman", isbn="978-0321486813", category="Computer Science", copies_available=0),
            Book(title="Computer Networking: A Top-Down Approach", author="Kurose, Ross", isbn="978-0133594140", category="Computer Science", copies_available=5),
        ]
        for b in books:
            db.add(b)
        db.commit()

        # 9. Seed Transport Buses & Routes
        bus_1 = Bus(bus_number="TS-09-UA-1234", driver_name="Ramesh Kumar", driver_phone="+91-9876543210", capacity=50)
        db.add(bus_1)
        db.commit()

        route_1 = BusRoute(bus_id=bus_1.id, route_name="Route 10A (Central Station to Campus)", stops="Central Station, Secunderabad, Campus Gate 1")
        db.add(route_1)

        bus_2 = Bus(bus_number="TS-09-UA-5678", driver_name="Suresh Singh", driver_phone="+91-9876543211", capacity=50)
        db.add(bus_2)
        db.commit()

        route_2 = BusRoute(bus_id=bus_2.id, route_name="Route 14B (Metro Link to North Gate)", stops="Metro Link, Campus Gate 2, Library")
        db.add(route_2)
        db.commit()

        # 10. Seed Companies and Applications
        companies_data = [
            Company(name="Google", industry="Technology", website="https://careers.google.com"),
            Company(name="Microsoft", industry="Technology", website="https://careers.microsoft.com"),
            Company(name="Amazon", industry="Cloud & E-Commerce", website="https://amazon.jobs"),
            Company(name="TCS Digital", industry="Information Technology", website="https://tcs.com"),
            Company(name="Infosys", industry="IT Services", website="https://infosys.com"),
            Company(name="Wipro", industry="IT Services", website="https://wipro.com"),
        ]
        for c in companies_data:
            db.add(c)
        db.commit()

        app = PlacementApplication(company_id=companies_data[0].id, student_id=student_profile.id, status="Applied")
        db.add(app)
        db.commit()

        # 11. Seed Fee Structure
        fee = FeeStructure(student_id=student_profile.id, total_amount=1250.00, paid_amount=0.0, due_date=datetime.date.today() + datetime.timedelta(days=30))
        db.add(fee)
        db.commit()

        # 12. Seed Exams, Predictions, Assignments, Drives, Leave Requests, Notifications, Clubs
        from app.models.database_models import (
            ExamTimetable, GradePrediction, Assignment, PlacementDrive,
            HostelLeaveRequest, Notification, Announcement, Club, ClubMembership
        )

        # Exams
        exam1 = ExamTimetable(
            subject_id=subs_dict["CS301"].id,
            semester=5,
            exam_date=datetime.date.today() + datetime.timedelta(days=14),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(13, 0),
            room_number="Hall 302",
            exam_type="End Semester"
        )
        exam2 = ExamTimetable(
            subject_id=subs_dict["CS302"].id,
            semester=5,
            exam_date=datetime.date.today() + datetime.timedelta(days=16),
            start_time=datetime.time(14, 0),
            end_time=datetime.time(17, 0),
            room_number="Hall 104",
            exam_type="End Semester"
        )
        exam3 = ExamTimetable(
            subject_id=subs_dict["CS303"].id,
            semester=5,
            exam_date=datetime.date.today() + datetime.timedelta(days=18),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(13, 0),
            room_number="Lab 2",
            exam_type="End Semester"
        )
        db.add_all([exam1, exam2, exam3])

        # Grade Predictions
        gp1 = GradePrediction(student_id=student_profile.id, subject_id=subs_dict["CS301"].id, predicted_grade="A", predicted_score="82-88%", confidence=84.5)
        gp2 = GradePrediction(student_id=student_profile.id, subject_id=subs_dict["CS302"].id, predicted_grade="A+", predicted_score="92-96%", confidence=91.0)
        gp3 = GradePrediction(student_id=student_profile.id, subject_id=subs_dict["CS303"].id, predicted_grade="A", predicted_score="85-90%", confidence=88.0)
        db.add_all([gp1, gp2, gp3])

        # Assignments
        assign1 = Assignment(
            title="DFA & NFA Simulator",
            description="Implement a finite state machine simulator in Python or C++.",
            faculty_id=1,
            subject_id=subs_dict["CS301"].id,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        assign2 = Assignment(
            title="Socket Programming & TCP Handshake",
            description="Write client-server socket scripts establishing TCP connection.",
            faculty_id=1,
            subject_id=subs_dict["CS302"].id,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=10)
        )
        db.add_all([assign1, assign2])

        # Placement Drives
        drive1 = PlacementDrive(
            company_id=companies_data[0].id,
            title="Software Development Engineer - I",
            package_lpa=24.5,
            min_cgpa=8.0,
            max_backlogs=0,
            location="Bengaluru / Hyderabad",
            required_skills="Python, Data Structures, System Design, SQL",
            deadline=datetime.date.today() + datetime.timedelta(days=20)
        )
        drive2 = PlacementDrive(
            company_id=companies_data[3].id,
            title="Digital Developer & Cloud Specialist",
            package_lpa=7.5,
            min_cgpa=6.5,
            max_backlogs=1,
            location="Pan India",
            required_skills="Java, Python, Web Development",
            deadline=datetime.date.today() + datetime.timedelta(days=25)
        )
        db.add_all([drive1, drive2])

        # Hostel Leave Request
        leave = HostelLeaveRequest(
            student_id=student_profile.id,
            reason="Weekend family visit to home town",
            start_date=datetime.date.today() + datetime.timedelta(days=2),
            end_date=datetime.date.today() + datetime.timedelta(days=5),
            status="Pending"
        )
        db.add(leave)

        # Notifications
        notif1 = Notification(user_id=student_user.id, title="Welcome to CampusOS AI", message="Your student account has been verified and registered.", type="info")
        notif2 = Notification(user_id=student_user.id, title="End-Semester Timetable Released", message="The End-Semester Exam Schedule for Semester V is now available under Exams.", type="alert")
        db.add_all([notif1, notif2])

        # Announcements
        ann1 = Announcement(title="Annual AI & Tech Innovation Summit 2026", content="Registrations are open for the annual CampusOS Hackathon. Top projects win cash prizes and direct interview opportunities.", author_role="admin", target_role="all")
        db.add(ann1)

        # Clubs
        club1 = Club(name="AI & Developers Club", description="Explore machine learning, open-source development, and build real-world AI applications.", category="Technical", president_name="Rahul Kumar")
        club2 = Club(name="Cyber Security Guild", description="Participate in CTF competitions, ethical hacking workshops, and security research.", category="Technical", president_name="Arjun Patel")
        db.add_all([club1, club2])
        db.commit()

        # Join Rahul to AI Club
        mem = ClubMembership(club_id=club1.id, student_id=student_profile.id, status="Active")
        db.add(mem)
        db.commit()

        print("Database seeded successfully with complete platform entities!")

    finally:
        db.close()

if __name__ == "__main__":
    init_db()

