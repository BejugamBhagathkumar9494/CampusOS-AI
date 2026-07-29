import datetime
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Permission,
    Role,
    User,
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
        # Check if database is already seeded
        if db.query(Role).first():
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 2. Create Roles
        role_names = [
            "Student",
            "Faculty",
            "Admin",
            "Hostel Warden",
            "Librarian",
            "Placement Officer",
            "Finance Officer",
            "Transport Manager",
        ]
        roles_dict = {}
        for name in role_names:
            role = Role(name=name, description=f"{name} role description")
            db.add(role)
            roles_dict[name] = role
        db.commit()

        # 3. Create Permissions
        permissions_list = [
            "manage_users", "view_analytics", "manage_hostel", 
            "manage_library", "manage_transport", "manage_placement", "manage_finance"
        ]
        perms_dict = {}
        for p_name in permissions_list:
            perm = Permission(name=p_name, description=f"Permission to {p_name.replace('_', ' ')}")
            db.add(perm)
            perms_dict[p_name] = perm
        db.commit()

        # Assign permissions to Admin
        roles_dict["Admin"].permissions.extend(list(perms_dict.values()))
        db.commit()

        # 4. Create default users: Admin & Student (John Doe)
        admin_user = User(
            email="admin@university.edu",
            hashed_password=get_password_hash("admin_password_2026"),
            full_name="System Admin",
            is_active=True
        )
        admin_user.roles.append(roles_dict["Admin"])
        db.add(admin_user)

        student_user = User(
            email="john.doe@university.edu",
            hashed_password=get_password_hash("student_password_2026"),
            full_name="John Doe",
            is_active=True
        )
        student_user.roles.append(roles_dict["Student"])
        db.add(student_user)
        db.commit()

        # Create Student Profile
        student_profile = Student(
            user_id=student_user.id,
            roll_number="CS2023001",
            cgpa=8.42,
            current_semester=5
        )
        db.add(student_profile)
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

        print("Database seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
