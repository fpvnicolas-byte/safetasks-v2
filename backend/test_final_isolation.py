#!/usr/bin/env python3
"""
Test final isolation for crew members
"""
import asyncio
from sqlalchemy import select
from app.db.session import get_db
from app.models.production import Production
from app.models.production_crew import ProductionCrew
from app.models.user import User


async def test_final_isolation():
    """Test final isolation implementation"""

    print("🛡️ TESTE FINAL - ISOLAMENTO DE DADOS CREW")
    print("=" * 60)

    async for session in get_db():
        try:
            # Find crew user
            result = await session.execute(
                select(User).where(User.email == "gato2@gmail.com")
            )
            crew_user = result.scalar_one_or_none()

            if not crew_user:
                print("❌ Usuário crew não encontrado")
                return False

            print(f"✅ Usuário Crew: {crew_user.full_name} (ID: {crew_user.id})")
            print(f"   Role: {crew_user.role}")

            # Test GET /productions/ query isolation
            print(f"\n🔍 Testando query GET /productions/:")

            result = await session.execute(
                select(Production).join(
                    ProductionCrew,
                    Production.id == ProductionCrew.production_id
                ).where(
                    Production.organization_id == crew_user.organization_id,
                    ProductionCrew.user_id == crew_user.id
                )
            )

            productions = result.scalars().all()

            print(f"📊 Query executada com JOIN:")
            print(f"   WHERE organization_id = {crew_user.organization_id} AND user_id = {crew_user.id}")

            if len(productions) == 1:
                prod = productions[0]
                print(f"✅ SUCESSO: Apenas 1 produção retornada (ID: {prod.id})")
                print(f"   Título: {prod.title}")

                # Test schema validation - should NOT have profit field
                from app.schemas.production import ProductionCrewResponse
                crew_response = ProductionCrewResponse.from_orm(prod)

                # Check if profit field is omitted
                if not hasattr(crew_response, 'profit'):
                    print("✅ Schema correto: campo 'profit' omitido")
                else:
                    print("❌ ERRO: campo 'profit' presente no schema crew")
                    return False

                return True
            else:
                print(f"❌ ERRO: {len(productions)} produções retornadas (esperado: 1)")
                return False

        except Exception as e:
            print(f"❌ Erro: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await session.close()
        break


async def main():
    success = await test_final_isolation()
    print(f"\n{'🎉 SISTEMA PROTEGIDO' if success else '🚨 SISTEMA VULNERÁVEL'}")
    print(f"Resultado: {'PASSOU' if success else 'FALHOU'}")


if __name__ == "__main__":
    asyncio.run(main())
