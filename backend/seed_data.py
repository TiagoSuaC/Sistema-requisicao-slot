"""Seed database with initial data"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Unit, Doctor

# Unidades reais SC
units_data = [
    ("01 - CLÍNICA SC CRICIÚMA", "CRICIÚMA"),
    ("02 - CLÍNICA SC CURITIBA", "CURITIBA"),
    ("03 - CLÍNICA SC FLORIANÓPOLIS", "FLORIANÓPOLIS"),
    ("04 - CLÍNICA SC BALNEÁRIO CAMBORIÚ", "BALNEÁRIO CAMBORIÚ"),
    ("06 - CLÍNICA SC JOINVILLE", "JOINVILLE"),
]

# Médicos reais - (nome, email_prefix)
doctors_data = [
    "ALEXEI GAMA DE ALBUQUERQUE CAVALCANTI",
    "BENIE CRISPEL GOLDMAN",
    "BRUNA LAIS FRONZA",
    "BRUNO ISMAIL SPLITT",
    "CESAR TAYER",
    "EDUARDO ANCELMO MARTINS",
    "EDWIN ANDRES CHARRIS CABALLERO",
    "ENEAS JOSÉ FIGUEIREDO SEVERIANO",
    "EVAH AGAJANIAN LUMI TANO",
    "EVANDO LAURITZEN LUCENA",
    "FABIO HENRIQUE PINTO DE MORAES",
    "FABRICIO VALANDRO RECH",
    "FELIPE MOTTA MOREIRA BRUNO",
    "FLAVIO BURG DEMAY",
    "GUILHERME PANCINHA PINTO",
    "HUBERTH ANDRE VIEIRA ZUBA",
    "HUGO FELIPE RAUEN",
    "JAKSON RAFAEL DELLATORRE",
    "JONNATTAN LUIS PRADA NUNEZ",
    "JULIANA VICENTINI BONATTO",
    "JULIO CEZAR CECHINEL FILHO",
    "LAIS RAMALHO CHAVES ISOBE",
    "LUCAS CUNHA ANDRADE",
    "LUIZ ANTÔNIO DA SILVA LAVRADAS JUNIOR",
    "MARCELLO SANTOS",
    "MARCELLO SANTOS DA SILVA",
    "MARCUS COIMBRA",
    "MARCUS VINICIUS DA SILVA COIMBRA FILHO",
    "MATHEUS BACKES ZAMBONATO",
    "MATHEUS VICTOR SEGHETTO",
    "OMAR ABBUD",
    "OMAR ABUD",
    "OMAR ABUD FRANCO ABDUUCH",
    "OMAR ABUD FRANCO ABDUCH",
    "PATRICIA DUTRA HAMILTON",
    "PEDRO RODRIGO BERTELLI TEJERINA",
    "PRISCILA TREVINE ARAUJO BEZERRA DE MENEZES",
    "RAFAEL BARROUIN CARVALHO DE SOUZA",
    "RAFAEL DE MENEZES BATISTA",
    "RAFAEL TAVARES BARBOSA LIMA",
    "RAFAELA SAHB FREIRE",
    "RENATA FERNANDA RAMOS MARCANTE",
    "ROBSON FELTRIN",
    "ROSANE ZANATTA",
    "SERGIO ANDRE BUCCI FERNANDES",
    "VICTOR FABRICIO DE MORAES ROSSET",
    "VICTORIA RUSSOWSKY",
    "WARLEY PEREIRA DA COSTA",
    "YURI ASATO COSTA REIS",
]


def generate_email(name: str) -> str:
    """Generate email from doctor name"""
    # Get first name and last name initials
    parts = name.strip().split()
    if len(parts) >= 2:
        first_initial = parts[0][0].lower()
        last_initial = parts[-1][0].lower()
        base = f"{first_initial}{last_initial}"
    else:
        base = parts[0][:2].lower()

    # Normalize name for email
    normalized = name.lower().replace(" ", ".").replace("ç", "c").replace("ã", "a").replace("õ", "o").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    # Use first and last name
    email_parts = normalized.split(".")
    if len(email_parts) >= 2:
        email_name = f"{email_parts[0]}.{email_parts[-1]}"
    else:
        email_name = email_parts[0]

    return f"{email_name}@scclinica.com.br"


def seed_database(force: bool = False):
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_units = db.query(Unit).count()
        existing_doctors = db.query(Doctor).count()

        if existing_units > 0 or existing_doctors > 0:
            if not force:
                print("Database already seeded. Use --force to reseed.")
                print(f"Current: {existing_units} units, {existing_doctors} doctors")
                return
            else:
                print("Clearing existing data...")
                # Need to import MacroPeriod to delete it first (FK constraint)
                from app.models.macro_period import MacroPeriod
                from app.models.selection import MacroPeriodSelection
                from app.models.audit import AuditEvent

                db.query(AuditEvent).delete()
                db.query(MacroPeriodSelection).delete()
                db.query(MacroPeriod).delete()
                db.query(Doctor).delete()
                db.query(Unit).delete()
                db.commit()
                print("✓ Existing data cleared")

        print("Seeding database with real data...")

        # Create units
        units_created = 0
        for name, city in units_data:
            unit = Unit(
                name=name,
                city=city,
                config_turnos={
                    "morning": {"start": "08:00", "end": "12:00"},
                    "afternoon": {"start": "13:00", "end": "17:00"}
                }
            )
            db.add(unit)
            units_created += 1

        # Create doctors
        doctors_created = 0
        for name in doctors_data:
            email = generate_email(name)
            doctor = Doctor(
                name=name,
                email=email,
                active=True
            )
            db.add(doctor)
            doctors_created += 1

        db.commit()
        print(f"✓ Created {units_created} units")
        print(f"✓ Created {doctors_created} doctors")
        print("Database seeding completed successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    force = "--force" in sys.argv
    seed_database(force=force)
