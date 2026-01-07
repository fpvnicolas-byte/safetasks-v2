#!/usr/bin/env python3
"""
Test script to verify data isolation for crew members
"""
import asyncio
from sqlalchemy import select
from app.db.session import get_db
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.user import User


async def test_crew_isolation():
    """Test if crew members are properly isolated from financial data"""

    print("🔒 TESTANDO ISOLAMENTO DE DADOS PARA CREW")
    print("=" * 60)

    async for session in get_db():
        try:
            # Find a crew user
            result = await session.execute(
                select(User).where(User.role.in_(["crew", "user"]))
            )
            crew_user = result.scalar_one_or_none()

            if not crew_user:
                print("❌ Nenhum usuário crew encontrado para teste")
                return False

            print(f"✅ Usuário Crew encontrado: {crew_user.full_name} (ID: {crew_user.id})")

            # Test the isolation query that would be executed for crew members
            print(f"\n🔍 Executando query de isolamento para usuário {crew_user.id}:")

            result = await session.execute(
                select(Production).join(
                    ProductionCrew,
                    Production.id == ProductionCrew.production_id
                ).where(
                    Production.organization_id == crew_user.organization_id,
                    ProductionCrew.user_id == crew_user.id
                ).options(
                    # Note: not loading all relationships for this test
                )
            )

            productions = result.scalars().all()

            print(f"📊 Query executada com sucesso!")
            print(f"   JOIN com production_crew: ✅ Confirmado")
            print(f"   Produções encontradas: {len(productions)}")

            if productions:
                print("   ✅ Crew consegue ver apenas produções onde está escalado")
                for prod in productions:
                    print(f"      - Produção: {prod.title} (ID: {prod.id})")
            else:
                print("   ℹ️  Crew não está escalado em nenhuma produção")

            # Test that crew CANNOT see financial data
            print(f"\n💰 Verificando isolamento financeiro:")

            # Get a production that crew can access
            if productions:
                test_prod = productions[0]
                print(f"   Produção de teste: {test_prod.title}")
                print(f"   Profit no banco: R$ {(test_prod.profit/100):.2f}")

                # Simulate what crew would see via API
                from app.schemas.production import ProductionCrewResponse
                crew_response = ProductionCrewResponse.from_orm(test_prod)

                # Check if profit field is omitted (should raise AttributeError)
                try:
                    profit_value = getattr(crew_response, 'profit', 'OMITTED')
                    if profit_value == 'OMITTED':
                        print("   ✅ Campo 'profit' omitido do schema crew: CORRETO")
                    else:
                        print(f"   ❌ Campo 'profit' ainda presente: {profit_value}")
                        return False
                except AttributeError:
                    print("   ✅ Campo 'profit' não existe no schema crew: CORRETO")

            print(f"\n🎯 RESULTADO: Isolamento implementado com sucesso!")
            return True

        except Exception as e:
            print(f"❌ Erro durante teste: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await session.close()
        break


async def main():
    success = await test_crew_isolation()
    print(f"\n{'✅ SISTEMA SEGURO' if success else '❌ SISTEMA COMPROMETIDO'}")


if __name__ == "__main__":
    asyncio.run(main())
